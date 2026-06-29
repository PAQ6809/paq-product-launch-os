import { buildTranslationSourceSections } from "@/lib/translation/translation-sections";
import type { LaunchReport, TranslationLocale } from "@/types/report";

export function buildReportTranslationUserPrompt(report: LaunchReport, sourceLocale: TranslationLocale, targetLocale: TranslationLocale) {
  return JSON.stringify({
    task: "Localize the report section by section. Keep every sections key unchanged.",
    sourceLocale,
    targetLocale,
    productCategory: report.category,
    report: buildTranslationSourceSections(report)
  });
}
