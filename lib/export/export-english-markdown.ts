import { translationSectionMetas } from "@/lib/translation/translation-sections";
import type { TranslationResult } from "@/types/report";

export function exportEnglishMarkdown(translation: TranslationResult) {
  const lines = [
    "# English Product Launch Report",
    "",
    `> Source locale: ${translation.sourceLocale}. Target locale: ${translation.targetLocale}. Provider: ${translation.provider}. Model: ${translation.model}.`,
    "> Human review is required before publishing. Do not use unsupported product, health, beauty, medical, or sales-performance claims.",
    ""
  ];

  translationSectionMetas.forEach((meta) => {
    lines.push(`## ${meta.enTitle}`, "", translation.sections[meta.key], "");
  });

  return lines.join("\n").trim();
}
