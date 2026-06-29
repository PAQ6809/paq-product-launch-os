import { exportCsvSummary } from "@/lib/export/export-csv-summary";
import { exportProductAnalysisHtml } from "@/lib/export/export-product-analysis-html";
import { exportProductAnalysisJson } from "@/lib/export/export-product-analysis-json";
import { exportProductAnalysisMarkdown } from "@/lib/export/export-product-analysis-markdown";
import type { NormalizedProductAnalysisReport } from "@/lib/report-builder/types";

export type ExportPackage = {
  packageType: "zip-package-manifest";
  generatedAt: string;
  files: Array<{
    fileName: string;
    contentType: string;
    content: string;
  }>;
};

export function exportZipPackage(report: NormalizedProductAnalysisReport): ExportPackage {
  const baseName = slugify(report.productName || "product-analysis");

  // ponytail: Manifest-only package for v0.4.5; replace with a binary ZIP writer when file storage/downloads are real.
  return {
    packageType: "zip-package-manifest",
    generatedAt: new Date().toISOString(),
    files: [
      { fileName: `${baseName}/report.md`, contentType: "text/markdown; charset=utf-8", content: exportProductAnalysisMarkdown(report) },
      { fileName: `${baseName}/report.html`, contentType: "text/html; charset=utf-8", content: exportProductAnalysisHtml(report) },
      { fileName: `${baseName}/report.json`, contentType: "application/json; charset=utf-8", content: exportProductAnalysisJson(report) },
      { fileName: `${baseName}/summary.csv`, contentType: "text/csv; charset=utf-8", content: exportCsvSummary([report]) },
      {
        fileName: `${baseName}/metadata.json`,
        contentType: "application/json; charset=utf-8",
        content: JSON.stringify({ title: report.title, generatedAt: report.generatedAt, templateId: report.templateId }, null, 2)
      }
    ]
  };
}

function slugify(value: string) {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "product-analysis";
}
