import { NextResponse } from "next/server";
import { getLatestDraft } from "@/lib/db/drafts";
import { listExportJobs } from "@/lib/db/export-jobs";
import { listProducts } from "@/lib/db/products";
import { getHelpProvider } from "@/lib/help/get-help-provider";
import { trackHelpChatEvent } from "@/lib/help/help-audit";
import { getHelpKnowledgeBaseContext } from "@/lib/help/help-knowledge-base";
import { findHelpLinksForMessage } from "@/lib/help/help-links";
import { MockHelpProvider } from "@/lib/help/mock-help-provider";
import type { HelpChatApiResponse, HelpChatMessage, HelpUserContextSummary } from "@/lib/help/provider";
import { containsSecret, validateHelpAnswerPayload } from "@/lib/help/help-response-validator";
import { OUT_OF_SCOPE_HELP_ANSWER, guardHelpScope } from "@/lib/help/help-scope-guard";
import { getClientIp } from "@/lib/security/get-client-ip";
import {
  checkRateLimit,
  getHelpRateLimitConfig,
  type RateLimitDecision
} from "@/lib/security/rate-limit";
import { getCurrentUser } from "@/lib/supabase/server";
import { defaultLocale, isSupportedLocale, type AppLocale } from "@/i18n/routing";

export const runtime = "nodejs";

type NormalizedBody =
  | {
      ok: true;
      message: string;
      history: HelpChatMessage[];
      locale: AppLocale;
      currentPath?: string;
    }
  | { ok: false; error: string };

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const clientIp = getClientIp(request);
  const rateLimitConfig = getHelpRateLimitConfig();
  const rateLimitKey = `help-chat:${user?.id ?? (clientIp === "unknown" ? "anonymous" : clientIp)}`;
  const rateLimitDecision = checkRateLimit(rateLimitKey, rateLimitConfig);
  const rateLimit = {
    enabled: rateLimitConfig.enabled,
    remaining: rateLimitDecision.remaining,
    resetAt: rateLimitDecision.resetAt
  };

  if (!rateLimitDecision.allowed) {
    await trackHelpChatEvent({
      userId: user?.id ?? null,
      eventType: "help_chat_rate_limited",
      provider: "mock",
      isFallback: true
    });

    return NextResponse.json(
      {
        error: "HELP_RATE_LIMIT_EXCEEDED",
        message: "AI Help 使用次數已達目前 demo 限制，請稍後再試。",
        retryAfterSeconds: rateLimitDecision.retryAfterSeconds,
        resetAt: rateLimitDecision.resetAt
      },
      { status: 429, headers: buildRateLimitHeaders(rateLimitDecision, rateLimitConfig.maxRequests) }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_JSON", message: "Request body must be valid JSON." },
      { status: 400, headers: noStoreHeaders() }
    );
  }

  const body = normalizeHelpRequest(payload);
  if (!body.ok) {
    return NextResponse.json(
      { error: "INVALID_HELP_REQUEST", message: body.error },
      { status: 400, headers: noStoreHeaders() }
    );
  }

  const scopeGuard = guardHelpScope(body.message);
  const relatedLinks = findHelpLinksForMessage(body.message, body.locale);

  if (!scopeGuard.allowed) {
    await trackHelpChatEvent({
      userId: user?.id ?? null,
      eventType: "help_chat_out_of_scope",
      scope: "out_of_scope",
      provider: "mock",
      currentPath: body.currentPath
    });

    return NextResponse.json(
      {
        answer: scopeGuard.fixedAnswer ?? OUT_OF_SCOPE_HELP_ANSWER,
        scope: "out_of_scope",
        relatedLinks,
        suggestedActions: ["建立商品企劃", "查看 Demo 商品", "了解匯出格式"],
        provider: "mock",
        requestedProvider: "mock",
        model: "paq-help-scope-guard",
        isFallback: false,
        answeredAt: new Date().toISOString(),
        rateLimit,
        publicHelpAIEnabled: false,
        forcedMockInProduction: false
      } satisfies HelpChatApiResponse,
      { headers: buildRateLimitHeaders(rateLimitDecision, rateLimitConfig.maxRequests) }
    );
  }

  const selected = getHelpProvider();
  const input = {
    message: body.message,
    history: body.history,
    locale: body.locale,
    userId: user?.id,
    currentPath: body.currentPath,
    userContextSummary: await buildUserContextSummary(user?.id, scopeGuard.requiresAccountContext),
    knowledgeBaseContext: getHelpKnowledgeBaseContext(body.message),
    relatedLinks
  };

  try {
    const answer = await selected.provider.answerHelpQuestion(input);
    const withSelectionMetadata = {
      ...answer,
      provider: selected.provider.name,
      model: selected.provider.model,
      isFallback: answer.isFallback || Boolean(selected.warning),
      warning: selected.warning ?? answer.warning
    };
    const validation = validateHelpAnswerPayload(withSelectionMetadata);

    if (!validation.ok || containsSecret(JSON.stringify(withSelectionMetadata))) {
      throw new Error(`Help answer validation failed: ${validation.ok ? "secret-like value" : validation.errors.join("; ")}`);
    }

    await trackHelpChatEvent({
      userId: user?.id ?? null,
      eventType: "help_chat_asked",
      scope: validation.answer.scope,
      provider: validation.answer.provider,
      isFallback: validation.answer.isFallback,
      currentPath: body.currentPath
    });

    return NextResponse.json(
      {
        ...validation.answer,
        requestedProvider: selected.requestedProvider,
        rateLimit,
        publicHelpAIEnabled: selected.publicHelpAIEnabled,
        forcedMockInProduction: selected.forcedMockInProduction
      } satisfies HelpChatApiResponse,
      { headers: buildRateLimitHeaders(rateLimitDecision, rateLimitConfig.maxRequests) }
    );
  } catch (error) {
    const mockProvider = new MockHelpProvider();
    const fallbackAnswer = await mockProvider.answerHelpQuestion(input);
    const warning = [
      "Help provider failed. Fallback to MockHelpProvider.",
      getSafeProviderErrorMessage(error)
    ].join(" ");

    await trackHelpChatEvent({
      userId: user?.id ?? null,
      eventType: "help_chat_fallback",
      scope: fallbackAnswer.scope,
      provider: "mock",
      isFallback: true,
      currentPath: body.currentPath
    });

    return NextResponse.json(
      {
        ...fallbackAnswer,
        provider: "mock",
        requestedProvider: selected.requestedProvider,
        model: mockProvider.model,
        isFallback: true,
        warning,
        rateLimit,
        publicHelpAIEnabled: selected.publicHelpAIEnabled,
        forcedMockInProduction: selected.forcedMockInProduction
      } satisfies HelpChatApiResponse,
      { headers: buildRateLimitHeaders(rateLimitDecision, rateLimitConfig.maxRequests) }
    );
  }
}

function normalizeHelpRequest(payload: unknown): NormalizedBody {
  if (!isRecord(payload)) {
    return { ok: false, error: "Request body must be an object." };
  }

  const message = readString(payload.message).slice(0, 1000);
  if (!message) {
    return { ok: false, error: "message is required." };
  }

  const maxHistory = readPositiveInteger(process.env.HELP_MAX_MESSAGES_PER_THREAD, 20, 100);
  const history: HelpChatMessage[] = Array.isArray(payload.history)
    ? payload.history
        .filter(isRecord)
        .map((item) => ({
          role: item.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: readString(item.content).slice(0, 1000)
        }))
        .filter((item) => item.content)
        .slice(-maxHistory)
    : [];

  const locale = readString(payload.locale);

  return {
    ok: true,
    message,
    history,
    locale: isSupportedLocale(locale) ? locale : defaultLocale,
    currentPath: readSafePath(payload.currentPath)
  };
}

async function buildUserContextSummary(
  userId: string | undefined,
  required: boolean
): Promise<HelpUserContextSummary | undefined> {
  if (!required) {
    return undefined;
  }

  if (!userId) {
    return { isLoggedIn: false };
  }

  try {
    const [products, latestDraft, exportJobs] = await Promise.all([
      listProducts(userId),
      getLatestDraft(userId),
      listExportJobs(userId)
    ]);

    return {
      isLoggedIn: true,
      productCount: products.length,
      latestDraftExists: Boolean(latestDraft),
      latestProductUpdatedAt: products[0]?.createdAt ?? null,
      recentExportCount: exportJobs.length
    };
  } catch {
    return { isLoggedIn: true };
  }
}

function buildRateLimitHeaders(decision: RateLimitDecision, limit: number) {
  const headers: Record<string, string> = {
    ...noStoreHeaders(),
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(decision.remaining),
    "X-RateLimit-Reset": decision.resetAt
  };

  if (!decision.allowed) {
    headers["Retry-After"] = String(decision.retryAfterSeconds);
  }

  return headers;
}

function noStoreHeaders() {
  return { "Cache-Control": "no-store" };
}

function getSafeProviderErrorMessage(error: unknown) {
  const diagnosticsEnabled =
    process.env.NODE_ENV !== "production" && process.env.ENABLE_DEV_DIAGNOSTICS === "true";

  if (diagnosticsEnabled && error instanceof Error) {
    return error.message;
  }

  return "Enable development diagnostics locally for provider details.";
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readSafePath(value: unknown) {
  const path = readString(value).slice(0, 200);
  return path.startsWith("/") && !path.startsWith("//") ? path : undefined;
}

function readPositiveInteger(value: string | undefined, fallback: number, maximum: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, maximum);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
