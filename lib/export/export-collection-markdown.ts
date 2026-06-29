import { exportProductAnalysisMarkdown } from "@/lib/export/export-product-analysis-markdown";
import type { NormalizedProductAnalysisReport } from "@/lib/report-builder/types";

export type CollectionExportInput = {
  title: string;
  description?: string;
  reports: NormalizedProductAnalysisReport[];
};

export function exportCollectionMarkdown(collection: CollectionExportInput) {
  const lines = [
    `# ${collection.title}`,
    "",
    collection.description ?? "Portfolio-level product launch report collection.",
    "",
    "## Table of Contents",
    "",
    ...collection.reports.map((report, index) => `${index + 1}. ${report.productName}`),
    ""
  ];

  collection.reports.forEach((report) => {
    lines.push("---", "", exportProductAnalysisMarkdown(report));
  });

  return lines.join("\n").trimEnd() + "\n";
}
