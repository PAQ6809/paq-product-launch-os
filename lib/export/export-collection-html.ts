import { exportProductAnalysisHtml } from "@/lib/export/export-product-analysis-html";
import type { CollectionExportInput } from "@/lib/export/export-collection-markdown";

export function exportCollectionHtml(collection: CollectionExportInput) {
  const reports = collection.reports
    .map((report) => exportProductAnalysisHtml(report).replace(/<!doctype html>|<\/?html[^>]*>|<\/?head[^>]*>|<\/?body[^>]*>/g, ""))
    .join("<hr>");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(collection.title)}</title>
</head>
<body>
  <h1>${escapeHtml(collection.title)}</h1>
  <p>${escapeHtml(collection.description ?? "Portfolio-level product launch report collection.")}</p>
  ${reports}
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
