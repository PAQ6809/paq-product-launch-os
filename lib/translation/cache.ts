import type { LaunchReport, TranslationLocale, TranslationResult } from "@/types/report";

const PREFIX = "paq:v0.3.6:report-translation";

export function getReportSourceHash(report: LaunchReport) {
  const { generatedAt: _generatedAt, ...stableReport } = report;
  const input = JSON.stringify(stableReport);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) hash = Math.imul(hash ^ input.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(36);
}

export function translationCacheKey(reportId: string, targetLocale: TranslationLocale, report: LaunchReport) {
  return `${PREFIX}:${reportId}:${targetLocale}:${getReportSourceHash(report)}`;
}

export function readCachedTranslation(reportId: string, targetLocale: TranslationLocale, report: LaunchReport) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(translationCacheKey(reportId, targetLocale, report));
    return raw ? JSON.parse(raw) as TranslationResult : null;
  } catch { return null; }
}

export function writeCachedTranslation(reportId: string, translation: TranslationResult, report: LaunchReport) {
  if (typeof window === "undefined") return;
  localStorage.setItem(translationCacheKey(reportId, translation.targetLocale, report), JSON.stringify(translation));
}
