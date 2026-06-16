import type { LaunchReport } from "@/types/report";
import { formatCurrency } from "@/lib/utils";

const legalReminder =
  "蝦皮上架提醒：此內容只是不串 API 的可複製模板。請人工確認分類、規格、物流、圖片授權、商標、平台禁售規則與廣告宣稱；食品、美妝、醫療、保健品需額外法規審核。";

export function exportShopeeProductTemplate(report: LaunchReport) {
  return [
    `蝦皮商品頁模板｜${report.productName}`,
    "",
    "商品名稱",
    report.productTitle,
    "",
    "商品分類",
    report.category,
    "",
    "建議售價",
    formatCurrency(report.pricingStrategy.suggestedPrice),
    "",
    "商品賣點",
    ...report.keySellingPoints.map((point, index) => `${index + 1}. ${point}`),
    "",
    "商品描述",
    report.shortDescription,
    "",
    report.longDescription,
    "",
    "規格 / 包裝資訊",
    `包裝概念：${report.packagingBrief.concept}`,
    `視覺方向：${report.packagingBrief.visualDirection}`,
    `材質與結構：${report.packagingBrief.materials}`,
    "",
    "FAQ",
    ...report.faqs.flatMap((faq) => [`Q：${faq.question}`, `A：${faq.answer}`, ""]),
    "客服話術參考",
    ...report.customerServiceScripts.flatMap((script) => [
      `情境：${script.scenario}`,
      `回覆：${script.response}`,
      ""
    ]),
    "搜尋關鍵字 / Hashtags",
    report.seoKeywords.map((keyword) => `#${keyword.replace(/\s+/g, "")}`).join(" "),
    "",
    "注意事項",
    ...report.packagingBrief.complianceNotes.map((note) => `- ${note}`),
    `- ${legalReminder}`
  ].join("\n");
}
