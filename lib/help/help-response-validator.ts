import type { HelpAnswer, HelpProviderName, HelpRelatedLink, HelpScope } from "@/lib/help/provider";

const allowedScopes: HelpScope[] = ["site_help", "account_help", "security_help", "out_of_scope"];
const allowedProviders: HelpProviderName[] = ["mock", "nvidia"];
const secretPatterns = [/nvapi-[\w-]+/iu, /sk-[\w-]+/iu, /api[_-]?key\s*[:=]/iu];

export type HelpAnswerValidationResult =
  | { ok: true; answer: HelpAnswer }
  | { ok: false; errors: string[] };

export function parseHelpAnswerJson(raw: string): HelpAnswerValidationResult {
  try {
    return validateHelpAnswerPayload(JSON.parse(stripMarkdownFence(raw)));
  } catch (error) {
    return {
      ok: false,
      errors: [error instanceof Error ? error.message : "Help answer JSON parse failed."]
    };
  }
}

export function validateHelpAnswerPayload(payload: unknown): HelpAnswerValidationResult {
  if (!isRecord(payload)) {
    return { ok: false, errors: ["Help answer must be an object."] };
  }

  const errors: string[] = [];
  const answer = readString(payload.answer);
  const scope = readScope(payload.scope);
  const provider = readProvider(payload.provider);
  const model = readString(payload.model) || "unknown";
  const answeredAt = readString(payload.answeredAt) || new Date().toISOString();
  const relatedLinks = readRelatedLinks(payload.relatedLinks);
  const suggestedActions = readStringArray(payload.suggestedActions).slice(0, 4);
  const warning = readString(payload.warning);

  if (!answer) errors.push("answer must be a non-empty string.");
  if (!scope) errors.push("scope must be site_help, account_help, security_help, or out_of_scope.");
  if (!provider) errors.push("provider must be mock or nvidia.");
  if (containsSecret(answer) || containsSecret(JSON.stringify(payload))) {
    errors.push("Help answer appears to contain a secret-like value.");
  }

  if (errors.length > 0 || !scope || !provider) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    answer: {
      answer,
      scope,
      relatedLinks,
      suggestedActions,
      provider,
      model,
      isFallback: typeof payload.isFallback === "boolean" ? payload.isFallback : false,
      warning: warning || undefined,
      answeredAt
    }
  };
}

export function containsSecret(value: string) {
  return secretPatterns.some((pattern) => pattern.test(value));
}

function stripMarkdownFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/iu, "")
    .replace(/\s*```$/u, "")
    .trim();
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readScope(value: unknown): HelpScope | null {
  return allowedScopes.includes(value as HelpScope) ? (value as HelpScope) : null;
}

function readProvider(value: unknown): HelpProviderName | null {
  return allowedProviders.includes(value as HelpProviderName) ? (value as HelpProviderName) : null;
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];
}

function readRelatedLinks(value: unknown): HelpRelatedLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      label: readString(item.label),
      href: readString(item.href),
      description: readString(item.description) || undefined
    }))
    .filter((item) => item.label && item.href.startsWith("/"))
    .slice(0, 4);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
