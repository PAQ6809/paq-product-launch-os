import type { TranslationResult } from "@/types/report";

export function exportTranslatedJson(translation: TranslationResult) {
  return JSON.stringify(translation, null, 2);
}
