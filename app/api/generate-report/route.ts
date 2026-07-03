import { NextResponse } from "next/server";
import { getAIProvider, type SelectedAIProvider } from "@/lib/ai/get-provider";
import { MockAIProvider } from "@/lib/ai/mock-provider";
import { validateLaunchReportPayload } from "@/lib/ai/validators/launch-report-validator";
import { getProduct } from "@/lib/db/products";
import { saveLaunchReport } from "@/lib/db/reports";
import { trackWorkspaceEvent } from "@/lib/db/workspace-events";
import { getClientIp } from "@/lib/security/get-client-ip";
import {
  checkRateLimit,
  getRealAIRateLimitConfig,
  type RateLimitDecision
} from "@/lib/security/rate-limit";
import { getCurrentUser } from "@/lib/supabase/server";
import type { GenerateReportApiResponse } from "@/lib/ai/provider";
import type { LaunchReportInput } from "@/types/report";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const rateLimitConfig = getRealAIRateLimitConfig();
  const clientIp = getClientIp(request);
  const rateLimitKey = `generate-report:${user?.id ?? (clientIp === "unknown" ? "anonymous" : clientIp)}`;
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
        message: "Report generation rate limit exceeded. Please retry after the reset time.",
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
  const realAIRequireLogin = process.env.REAL_AI_REQUIRE_LOGIN !== "false";
  const requestedRealProvider = configuredProvider.requestedProvider !== "mock";
  const loginRequired = requestedRealProvider && realAIRequireLogin && !user;
  const forcedMockInProduction =
    process.env.NODE_ENV === "production" &&
    !publicRealAIEnabled &&
    requestedRealProvider;
  const selected = selectProvider(configuredProvider, {
    forcedMockInProduction,
    loginRequired
  });
  const warnings = [selected.warning].filter(Boolean) as string[];

  try {
    const generatedReport = await selected.provider.generateLaunchReport(inputResult.input, {
      userId: user?.id,
      productId: inputResult.productId,
      model: selected.provider.model
    });
    const validation = validateLaunchReportPayload(generatedReport, { requireAnalysis: true });

    if (!validation.ok) {
      throw new Error(`Provider output validation failed: ${validation.errors.join("; ")}`);
    }

    const report = {
      ...validation.report,
      metadata: {
        provider: selected.provider.name,
        model: selected.provider.model,
        isAiGenerated: true,
        isFallback: Boolean(selected.warning),
        generatedAt: validation.report.generatedAt,
        assumptionsUsed: validation.report.metadata?.assumptionsUsed ?? validation.report.analysis?.productDiagnosis.assumptions ?? [],
        confidenceLevel: validation.report.metadata?.confidenceLevel ?? "medium",
        validationPassed: true,
        warnings: Array.from(new Set([...(validation.report.metadata?.warnings ?? []), ...validation.warnings, ...warnings]))
      }
    };
    const saveResult = await saveReportIfPossible(user?.id, inputResult.productId, report, {
      provider: selected.provider.name,
      model: selected.provider.model,
      isFallback: Boolean(selected.warning),
      validationPassed: true,
      generatedAt: report.generatedAt
    });

    if (saveResult.warning) warnings.push(saveResult.warning);

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
      loginRequired,
      realAIEligible: !loginRequired && !forcedMockInProduction && selected.provider.name !== "mock",
      savedReportId: saveResult.reportId,
      warning: warnings.length > 0 ? Array.from(new Set(warnings)).join(" ") : undefined,
      validationWarnings: validation.warnings
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
      report: {
        ...fallbackReport,
        metadata: {
          provider: "mock",
          model: mockProvider.model,
          isAiGenerated: true,
          isFallback: true,
          generatedAt: fallbackReport.generatedAt,
          assumptionsUsed: fallbackReport.metadata?.assumptionsUsed ?? fallbackReport.analysis?.productDiagnosis.assumptions ?? [],
          confidenceLevel: fallbackReport.metadata?.confidenceLevel ?? "medium",
          validationPassed: true,
          warnings: Array.from(new Set([...(fallbackReport.metadata?.warnings ?? []), warning]))
        }
      },
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
      loginRequired,
      realAIEligible: false,
      warning
    };

    return NextResponse.json(response, {
      headers: buildRateLimitHeaders(rateLimitDecision, rateLimitConfig.maxRequests)
    });
  }
}

function selectProvider(
  configuredProvider: SelectedAIProvider,
  flags: { forcedMockInProduction: boolean; loginRequired: boolean }
): SelectedAIProvider {
  if (flags.forcedMockInProduction) {
    return {
      provider: new MockAIProvider(),
      requestedProvider: configuredProvider.requestedProvider,
      warning: "Public real AI is disabled in production. Forced fallback to MockAIProvider."
    };
  }

  if (flags.loginRequired) {
    return {
      provider: new MockAIProvider(),
      requestedProvider: configuredProvider.requestedProvider,
      warning: "Login required for real AI analysis. Fallback to MockAIProvider."
    };
  }

  return configuredProvider;
}

async function saveReportIfPossible(
  userId: string | undefined,
  productId: string,
  report: GenerateReportApiResponse["report"],
  metadata: Parameters<typeof saveLaunchReport>[3]
) {
  if (!userId || !productId) {
    return { reportId: undefined, warning: undefined };
  }

  try {
    const product = await getProduct(userId, productId);
    if (!product) {
      return { reportId: undefined, warning: "Report was generated but not saved because product ownership could not be verified." };
    }

    const saved = await saveLaunchReport(userId, productId, report, metadata);
    await trackWorkspaceEvent(userId, productId, "report.generated", { provider: metadata.provider });
    return { reportId: saved.id, warning: undefined };
  } catch (error) {
    return {
      reportId: undefined,
      warning: `Report was generated but cloud save failed: ${getSafePersistenceErrorMessage(error)}`
    };
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

function getSafePersistenceErrorMessage(error: unknown) {
  if (process.env.NODE_ENV !== "production" && error instanceof Error) {
    return error.message;
  }

  return "Persistence failed.";
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
      productId: string;
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
  const productId = readString(payload, "productId");

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
    },
    productId
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
      .split(/[,，\n]/u)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
