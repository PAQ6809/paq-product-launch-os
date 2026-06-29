import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/get-provider";
import { MockAIProvider } from "@/lib/ai/mock-provider";
import { validateLaunchReportPayload } from "@/lib/ai/validators/launch-report-validator";
import { getClientIp } from "@/lib/security/get-client-ip";
import {
  checkRateLimit,
  getRateLimitConfig,
  type RateLimitDecision
} from "@/lib/security/rate-limit";
import type { GenerateReportApiResponse } from "@/lib/ai/provider";
import type { LaunchReportInput } from "@/types/report";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimitConfig = getRateLimitConfig();
  const clientIp = getClientIp(request);
  const rateLimitKey = `generate-report:${clientIp === "unknown" ? "anonymous" : clientIp}`;
  const rateLimitDecision = checkRateLimit(rateLimitKey, rateLimitConfig);
  const rateLimit = {
    enabled: rateLimitConfig.enabled,
    remaining: rateLimitDecision.remaining,
    resetAt: rateLimitDecision.resetAt
  };

  if (!rateLimitDecision.allowed) {
    return NextResponse.json(
      {
        error: "RATE_LIMIT_EXCEEDED",
        message: "此 IP 已達商品報告生成上限，請於限制重置後再試。",
        retryAfterSeconds: rateLimitDecision.retryAfterSeconds,
        resetAt: rateLimitDecision.resetAt
      },
      {
        status: 429,
        headers: buildRateLimitHeaders(rateLimitDecision, rateLimitConfig.maxRequests)
      }
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400, headers: buildRateLimitHeaders(rateLimitDecision, rateLimitConfig.maxRequests) }
    );
  }

  const inputResult = normalizeLaunchReportInput(payload);

  if (!inputResult.ok) {
    return NextResponse.json(
      { error: inputResult.error },
      { status: 400, headers: buildRateLimitHeaders(rateLimitDecision, rateLimitConfig.maxRequests) }
    );
  }

  const configuredProvider = getAIProvider();
  const publicRealAIEnabled = isEnvironmentFlagEnabled(process.env.ENABLE_PUBLIC_REAL_AI);
  const forcedMockInProduction =
    process.env.NODE_ENV === "production" &&
    !publicRealAIEnabled &&
    configuredProvider.requestedProvider !== "mock";
  const selected = forcedMockInProduction
    ? {
        provider: new MockAIProvider(),
        requestedProvider: configuredProvider.requestedProvider,
        warning: "Public real AI is disabled in production. Forced fallback to MockAIProvider."
      }
    : configuredProvider;

  try {
    const generatedReport = await selected.provider.generateLaunchReport(inputResult.input);
    const validation = validateLaunchReportPayload(generatedReport);

    if (!validation.ok) {
      throw new Error(`Provider output validation failed: ${validation.errors.join("; ")}`);
    }

    const report = validation.report;
    const response: GenerateReportApiResponse = {
      report,
      provider: selected.provider.name,
      requestedProvider: selected.requestedProvider,
      isFallback: Boolean(selected.warning),
      isAiGenerated: true,
      model: selected.provider.model,
      generatedAt: report.generatedAt,
      validationPassed: true,
      rateLimit,
      publicRealAIEnabled,
      forcedMockInProduction,
      warning: selected.warning
    };

    return NextResponse.json(response, {
      headers: buildRateLimitHeaders(rateLimitDecision, rateLimitConfig.maxRequests)
    });
  } catch (error) {
    const mockProvider = new MockAIProvider();
    const fallbackReport = await mockProvider.generateLaunchReport(inputResult.input);
    const warning = [
      `${providerLabel(selected.provider.name)} failed. Fallback to MockAIProvider.`,
      getSafeProviderErrorMessage(error)
    ].join(" ");

    const response: GenerateReportApiResponse = {
      report: fallbackReport,
      provider: "mock",
      requestedProvider: selected.requestedProvider,
      isFallback: true,
      isAiGenerated: true,
      model: mockProvider.model,
      generatedAt: fallbackReport.generatedAt,
      validationPassed: true,
      rateLimit,
      publicRealAIEnabled,
      forcedMockInProduction,
      warning
    };

    return NextResponse.json(response, {
      headers: buildRateLimitHeaders(rateLimitDecision, rateLimitConfig.maxRequests)
    });
  }
}

function buildRateLimitHeaders(decision: RateLimitDecision, limit: number) {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(decision.remaining),
    "X-RateLimit-Reset": decision.resetAt
  };

  if (!decision.allowed) {
    headers["Retry-After"] = String(decision.retryAfterSeconds);
  }

  return headers;
}

function isEnvironmentFlagEnabled(value: string | undefined) {
  return value === "true";
}

function getSafeProviderErrorMessage(error: unknown) {
  const diagnosticsEnabled =
    process.env.NODE_ENV !== "production" &&
    isEnvironmentFlagEnabled(process.env.ENABLE_DEV_DIAGNOSTICS);

  if (diagnosticsEnabled && error instanceof Error) {
    return error.message;
  }

  return "Provider generation failed. Enable development diagnostics locally for details.";
}

function providerLabel(provider: "mock" | "openai" | "nvidia") {
  if (provider === "openai") {
    return "OpenAIProvider";
  }

  if (provider === "nvidia") {
    return "NvidiaProvider";
  }

  return "AI provider";
}

type InputResult =
  | {
      ok: true;
      input: LaunchReportInput;
    }
  | {
      ok: false;
      error: string;
    };

function normalizeLaunchReportInput(payload: unknown): InputResult {
  if (!isRecord(payload)) {
    return { ok: false, error: "Request body must be an object." };
  }

  const productName = readString(payload, "productName");
  const category = readString(payload, "category");
  const features = readString(payload, "features");
  const cost = readNumber(payload, "cost");
  const targetPrice = readNumber(payload, "targetPrice");
  const targetAudience = readString(payload, "targetAudience");
  const brandStyle = readString(payload, "brandStyle");
  const imageUrl = readString(payload, "imageUrl", "/hero-workspace.png");
  const salesChannels = readStringArray(payload, "salesChannels");

  const missing = [
    ["productName", productName],
    ["category", category],
    ["features", features],
    ["targetAudience", targetAudience],
    ["brandStyle", brandStyle]
  ]
    .filter(([, value]) => typeof value !== "string" || value.trim().length === 0)
    .map(([field]) => field);

  if (missing.length > 0) {
    return { ok: false, error: `Missing required fields: ${missing.join(", ")}` };
  }

  if (!Number.isFinite(cost) || !Number.isFinite(targetPrice)) {
    return { ok: false, error: "cost and targetPrice must be valid numbers." };
  }

  return {
    ok: true,
    input: {
      productName,
      category,
      features,
      cost,
      targetPrice,
      targetAudience,
      brandStyle,
      salesChannels,
      imageUrl
    }
  };
}

function readString(record: Record<string, unknown>, field: string, fallback = "") {
  const value = record[field];
  return typeof value === "string" ? value.trim() : fallback;
}

function readNumber(record: Record<string, unknown>, field: string) {
  const value = record[field];

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value.replace(/,/g, "").trim());
  }

  return Number.NaN;
}

function readStringArray(record: Record<string, unknown>, field: string) {
  const value = record[field];

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,、\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
