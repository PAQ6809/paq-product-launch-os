import type { Product, ReportSection } from "@/types";
import { formatCurrency, reviewLabels, riskLabels } from "@/lib/utils";

export function buildReportMarkdown(product: Product, sections: ReportSection[]) {
  const lines = [
    `# ${product.name} 商品上市報告`,
    "",
    "> Demo / Mock AI report。內容可能經人工審核或修改；正式對外使用前仍需完成法規、商標、版權與平台規則檢查。",
    "",
    "## 商品基本資料",
    "",
    `- 商品類別：${product.category}`,
    `- 商品功能：${product.features}`,
    `- 商品成本：${formatCurrency(product.cost)}`,
    `- 預計售價：${formatCurrency(product.expectedPrice)}`,
    `- 目標客群：${product.targetAudience}`,
    `- 品牌風格：${product.brandStyle}`,
    `- 銷售平台：${product.salesPlatforms.join("、")}`,
    ""
  ];

  for (const section of sections) {
    lines.push(`## ${section.title}`);
    lines.push("");
    lines.push(section.content);
    lines.push("");
    lines.push(`- 風險等級：${riskLabels[section.riskLevel]}`);
    lines.push(`- 審核狀態：${reviewLabels[section.reviewStatus]}`);
    lines.push(`- human_edited：${section.humanEdited ? "yes" : "no"}`);
    lines.push("");
  }

  lines.push("---");
  lines.push("此檔案由 PAQ Product Launch OS MVP Demo 匯出。");

  return lines.join("\n");
}
