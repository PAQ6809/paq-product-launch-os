import { translationSectionMetas } from "@/lib/translation/translation-sections";
import type { ReportSection, TranslationResult } from "@/types";

export function exportBilingualMarkdown(sourceSections: ReportSection[], translation: TranslationResult) {
  const sourceById = new Map(sourceSections.map((section) => [section.id, section.content]));
  const lines = [
    "# Bilingual Product Launch Report",
    "",
    `> Source: ${translation.sourceLocale}. Target: ${translation.targetLocale}. Provider: ${translation.provider}. Model: ${translation.model}. Fallback: ${translation.isFallback}.`,
    "> Human review is required before publishing.",
    ""
  ];

  translationSectionMetas.forEach((meta) => {
    lines.push(`## ${meta.zhTitle} / ${meta.enTitle}`, "", "### 中文原文", "");
    lines.push(sourceById.get(meta.sourceSectionId) ?? "");
    lines.push("", `### Translation (${translation.targetLocale})`, "", translation.sections[meta.key], "");
  });

  return lines.join("\n").trim();
}
