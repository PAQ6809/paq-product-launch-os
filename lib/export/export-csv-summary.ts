import type { NormalizedProductAnalysisReport } from "@/lib/report-builder/types";

export function exportCsvSummary(reports: NormalizedProductAnalysisReport[]) {
  const rows = [
    ["productName", "title", "generatedAt", "sectionCount", "riskNotes"],
    ...reports.map((report) => [
      report.productName,
      report.title,
      report.generatedAt,
      String(report.sections.length),
      report.source.report.legalRiskNotes.join("; ")
    ])
  ];

  return rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
