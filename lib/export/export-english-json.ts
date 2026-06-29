import type { TranslationResult } from "@/types/report";

export function exportEnglishJson(translation: TranslationResult) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      legalReminder:
        "Human review is required before publishing. Do not use unsupported product, health, beauty, medical, or sales-performance claims.",
      translation
    },
    null,
    2
  );
}
