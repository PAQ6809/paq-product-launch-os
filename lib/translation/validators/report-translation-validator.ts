import { isSupportedLocale } from "@/i18n/routing";
import { translationSectionKeys } from "@/lib/translation/translation-sections";
import type { TranslationResult } from "@/types/report";

type ValidationResult =
  | { ok: true; translation: TranslationResult; errors: [] }
  | { ok: false; translation: null; errors: string[] };

const riskyTerms = [
  "cure", "treat disease", "guaranteed results", "guaranteed sales", "clinically proven",
  "保證療效", "治療疾病", "保證銷售", "月收保證"
];

export function validateReportTranslation(payload: unknown): ValidationResult {
  if (!isRecord(payload)) return { ok: false, translation: null, errors: ["Translation payload must be an object."] };

  const errors: string[] = [];
  if (typeof payload.sourceLocale !== "string" || !isSupportedLocale(payload.sourceLocale)) errors.push("sourceLocale is unsupported.");
  if (typeof payload.targetLocale !== "string" || !isSupportedLocale(payload.targetLocale)) errors.push("targetLocale is unsupported.");
  if (!["mock", "openai", "nvidia"].includes(String(payload.provider))) errors.push("provider is unsupported.");
  if (!nonEmpty(payload.translatedAt)) errors.push("translatedAt must be a non-empty string.");
  if (!nonEmpty(payload.model)) errors.push("model must be a non-empty string.");
  if (typeof payload.isFallback !== "boolean") errors.push("isFallback must be a boolean.");

  if (!isRecord(payload.sections)) {
    errors.push("sections must be an object.");
  } else {
    const sections = payload.sections;
    for (const key of translationSectionKeys) {
      if (!nonEmpty(sections[key])) errors.push(`sections.${key} must be a non-empty string.`);
    }
    const commercialCopy = translationSectionKeys
      .filter((key) => key !== "legalRiskNotes")
      .map((key) => sections[key])
      .join(" ")
      .toLowerCase();
    const found = riskyTerms.filter((term) => commercialCopy.includes(term.toLowerCase()));
    if (found.length) errors.push(`High-risk claims found: ${found.join(", ")}.`);
  }

  if (errors.length) return { ok: false, translation: null, errors };
  return { ok: true, translation: payload as TranslationResult, errors: [] };
}

export function parseReportTranslationJson(rawText: string) {
  try {
    return validateReportTranslation(JSON.parse(rawText));
  } catch (error) {
    return { ok: false, translation: null, errors: [error instanceof Error ? error.message : "Invalid JSON response."] } as const;
  }
}

export function assertValidReportTranslation(payload: unknown) {
  const result = validateReportTranslation(payload);
  if (!result.ok) throw new Error(`Invalid translation result: ${result.errors.join("; ")}`);
  return result.translation;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
