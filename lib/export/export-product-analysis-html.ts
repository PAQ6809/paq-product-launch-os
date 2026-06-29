import type { NormalizedProductAnalysisReport } from "@/lib/report-builder/types";

export function exportProductAnalysisHtml(report: NormalizedProductAnalysisReport) {
  const sections = report.sections
    .map(
      (section) => `
        <section>
          <h2>${escapeHtml(section.title)}</h2>
          <ul>
            ${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(report.title)}</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; color: #17211f; line-height: 1.65; margin: 40px; }
    h1, h2 { line-height: 1.2; }
    section { border-top: 1px solid #dbe5e1; padding-top: 20px; margin-top: 24px; }
    .notice { background: #f5fbf8; border: 1px solid #cde7df; padding: 12px 14px; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(report.title)}</h1>
  <p><strong>Prepared for:</strong> ${escapeHtml(report.preparedFor)}</p>
  <p><strong>Generated at:</strong> ${escapeHtml(report.generatedAt)}</p>
  <p class="notice">${escapeHtml(report.confidentialityNotice)}</p>
  ${sections}
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
