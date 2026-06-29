import { NextResponse } from "next/server";
import { validateLaunchReportPayload } from "@/lib/ai/validators/launch-report-validator";
import { getClientIp } from "@/lib/security/get-client-ip";
import { checkRateLimit, getRateLimitConfig } from "@/lib/security/rate-limit";
import { getTranslationProvider } from "@/lib/translation/get-translation-provider";
import { MockTranslationProvider } from "@/lib/translation/mock-translation-provider";
import { isSupportedLocale } from "@/lib/translation/supported-locales";
import { validateReportTranslation } from "@/lib/translation/validators/report-translation-validator";
import type { TranslateReportApiResponse, TranslationOptions } from "@/lib/translation/provider";
import type { TranslationProviderName } from "@/types/report";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const rateLimit = checkRateLimit(`translate:${getClientIp(request)}`, getRateLimitConfig());
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "RATE_LIMIT_EXCEEDED", message: "Translation request limit exceeded.", retryAfterSeconds: rateLimit.retryAfterSeconds, resetAt: rateLimit.resetAt }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });
  }

  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 }); }
  if (!isRecord(payload)) return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });

  const reportValidation = validateLaunchReportPayload(payload.report ?? payload);
  if (!reportValidation.ok) return NextResponse.json({ error: "Invalid LaunchReport payload.", validationErrors: reportValidation.errors }, { status: 400 });

  const sourceLocale = typeof payload.sourceLocale === "string" && isSupportedLocale(payload.sourceLocale) ? payload.sourceLocale : "zh-TW";
  const targetLocale = typeof payload.targetLocale === "string" && isSupportedLocale(payload.targetLocale) ? payload.targetLocale : "en";
  if (sourceLocale === targetLocale) return NextResponse.json({ error: "Source and target locales must differ." }, { status: 400 });

  const preference = normalizePreference(payload.providerPreference);
  const publicRealAIEnabled = process.env.ENABLE_PUBLIC_REAL_AI === "true";
  const forcedMockInProduction = process.env.NODE_ENV === "production" && !publicRealAIEnabled && preference !== "mock";
  const selected = forcedMockInProduction
    ? { provider: new MockTranslationProvider(), requestedProvider: preference, warning: "Real AI translation is disabled for the public production demo." }
    : getTranslationProvider(preference);
  const options: TranslationOptions = { sourceLocale, targetLocale, productCategory: typeof payload.productCategory === "string" ? payload.productCategory : reportValidation.report.category };

  try {
    const translation = await selected.provider.translateLaunchReport(reportValidation.report, options);
    const validation = validateReportTranslation(translation);
    if (!validation.ok) throw new Error(validation.errors.join("; "));
    const warning = selected.warning ?? validation.translation.warning;
    const isFallback = Boolean(selected.warning) || forcedMockInProduction;
    const response: TranslateReportApiResponse & { rateLimit: typeof rateLimit; publicRealAIEnabled: boolean; forcedMockInProduction: boolean } = {
      translation: { ...validation.translation, isFallback, warning }, provider: selected.provider.name, requestedProvider: selected.requestedProvider,
      isFallback, warning, model: selected.provider.model, generatedAt: new Date().toISOString(), validationPassed: true, durationMs: Date.now() - startedAt,
      rateLimit, publicRealAIEnabled, forcedMockInProduction
    };
    return NextResponse.json(response);
  } catch (error) {
    const fallback = new MockTranslationProvider();
    const warning = `${selected.provider.name} translation failed. Fallback to mock. ${error instanceof Error ? error.message : "Unknown error."}`;
    const translation = await fallback.translateLaunchReport(reportValidation.report, options);
    const response: TranslateReportApiResponse = { translation: { ...translation, isFallback: true, warning }, provider: "mock", requestedProvider: selected.requestedProvider, isFallback: true, warning, model: fallback.model, generatedAt: new Date().toISOString(), validationPassed: true, durationMs: Date.now() - startedAt };
    return NextResponse.json(response);
  }
}

function normalizePreference(value: unknown): TranslationProviderName {
  return value === "openai" || value === "nvidia" || value === "mock" ? value : (process.env.TRANSLATION_PROVIDER === "openai" || process.env.TRANSLATION_PROVIDER === "nvidia" ? process.env.TRANSLATION_PROVIDER : "mock");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
