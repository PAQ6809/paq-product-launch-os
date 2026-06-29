import type { NormalizedProductAnalysisReport } from "@/lib/report-builder/types";

export function exportProductAnalysisMarkdown(report: NormalizedProductAnalysisReport) {
  const lines = [
    `# ${report.title}`,
    "",
    `Prepared for: ${report.preparedFor}`,
    `Generated at: ${report.generatedAt}`,
    "",
    `> ${report.confidentialityNotice}`,
    ""
  ];

  report.sections.forEach((section) => {
    lines.push(`## ${section.title}`, "");
    section.items.forEach((item) => lines.push(`- ${item}`));
    lines.push("");
  });

  return lines.join("\n").trimEnd() + "\n";
}
