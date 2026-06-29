import type { NormalizedProductAnalysisReport } from "@/lib/report-builder/types";

export function exportProductAnalysisJson(report: NormalizedProductAnalysisReport) {
  return JSON.stringify(report, null, 2);
}
