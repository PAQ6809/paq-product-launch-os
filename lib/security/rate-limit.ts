import "server-only";

export type RateLimitConfig = {
  enabled: boolean;
  windowSeconds: number;
  maxRequests: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  retryAfterSeconds: number;
};

type RateLimitEntry = {
  count: number;
  resetAtMs: number;
};

type GlobalRateLimitState = typeof globalThis & {
  __paqGenerateReportRateLimit?: Map<string, RateLimitEntry>;
};

const globalRateLimitState = globalThis as GlobalRateLimitState;
const rateLimitStore =
  globalRateLimitState.__paqGenerateReportRateLimit ?? new Map<string, RateLimitEntry>();

globalRateLimitState.__paqGenerateReportRateLimit = rateLimitStore;

export function getRateLimitConfig(
  environment: Record<string, string | undefined> = process.env
): RateLimitConfig {
  return {
    enabled: environment.RATE_LIMIT_ENABLED !== "false",
    windowSeconds: readPositiveInteger(environment.RATE_LIMIT_WINDOW_SECONDS, 3_600, 604_800),
    maxRequests: readPositiveInteger(environment.RATE_LIMIT_MAX_REQUESTS, 5, 10_000)
  };
}

export function getRealAIRateLimitConfig(
  environment: Record<string, string | undefined> = process.env
): RateLimitConfig {
  return {
    enabled: (environment.REAL_AI_RATE_LIMIT_ENABLED ?? environment.RATE_LIMIT_ENABLED) !== "false",
    windowSeconds: readPositiveInteger(
      environment.REAL_AI_RATE_LIMIT_WINDOW_SECONDS ?? environment.RATE_LIMIT_WINDOW_SECONDS,
      3_600,
      604_800
    ),
    maxRequests: readPositiveInteger(
      environment.REAL_AI_RATE_LIMIT_MAX_REQUESTS ?? environment.RATE_LIMIT_MAX_REQUESTS,
      5,
      10_000
    )
  };
}

export function getHelpRateLimitConfig(
  environment: Record<string, string | undefined> = process.env
): RateLimitConfig {
  return {
    enabled: environment.HELP_RATE_LIMIT_ENABLED !== "false",
    windowSeconds: readPositiveInteger(environment.HELP_RATE_LIMIT_WINDOW_SECONDS, 3_600, 604_800),
    maxRequests: readPositiveInteger(environment.HELP_RATE_LIMIT_MAX_REQUESTS, 20, 10_000)
  };
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = getRateLimitConfig(),
  nowMs = Date.now()
): RateLimitDecision {
  const resetAtMs = nowMs + config.windowSeconds * 1_000;

  if (!config.enabled) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(resetAtMs).toISOString(),
      retryAfterSeconds: 0
    };
  }

  removeExpiredEntries(nowMs);

  const normalizedKey = key.trim() || "anonymous";
  const current = rateLimitStore.get(normalizedKey);

  if (!current || current.resetAtMs <= nowMs) {
    rateLimitStore.set(normalizedKey, {
      count: 1,
      resetAtMs
    });

    return {
      allowed: true,
      remaining: Math.max(config.maxRequests - 1, 0),
      resetAt: new Date(resetAtMs).toISOString(),
      retryAfterSeconds: 0
    };
  }

  if (current.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(current.resetAtMs).toISOString(),
      retryAfterSeconds: Math.max(Math.ceil((current.resetAtMs - nowMs) / 1_000), 1)
    };
  }

  current.count += 1;
  rateLimitStore.set(normalizedKey, current);

  return {
    allowed: true,
    remaining: Math.max(config.maxRequests - current.count, 0),
    resetAt: new Date(current.resetAtMs).toISOString(),
    retryAfterSeconds: 0
  };
}

function removeExpiredEntries(nowMs: number) {
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAtMs <= nowMs) {
      rateLimitStore.delete(key);
    }
  }
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
