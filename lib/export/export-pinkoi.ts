import type { LaunchReport } from "@/types/report";
import { formatCurrency } from "@/lib/utils";

const legalReminder =
  "Pinkoi 上架提醒：此內容只是不串 API 的可複製模板。請人工確認設計館規範、圖片/字體/插畫授權、商品事實、商標與法規宣稱；食品、美妝、醫療、保健品需額外審核。";

export function exportPinkoiProductTemplate(report: LaunchReport) {
  return [
    `Pinkoi 商品頁模板｜${report.productName}`,
    "",
    "商品名稱",
    report.productTitle,
    "",
    "設計理念",
    report.positioning,
    "",
    "商品故事",
    report.longDescription,
    "",
    "商品特色",
    ...report.keySellingPoints.map((point) => `- ${point}`),
    "",
    "價格建議",
    `建議售價：${formatCurrency(report.pricingStrategy.suggestedPrice)}`,
    `首發策略：${report.pricingStrategy.promoNotes}`,
    "",
    "材質 / 包裝",
    `概念：${report.packagingBrief.concept}`,
    `視覺方向：${report.packagingBrief.visualDirection}`,
    `材質與結構：${report.packagingBrief.materials}`,
    "",
    "送禮與開箱文案",
    report.frontPackagingCopy,
    "",
    report.backPackagingCopy,
    "",
    "關鍵字",
    report.seoKeywords.join("、"),
    "",
    "購買前提醒",
    ...report.faqs.map((faq) => `- ${faq.question}：${faq.answer}`),
    "",
    "法規與授權提醒",
    ...report.packagingBrief.complianceNotes.map((note) => `- ${note}`),
    `- ${legalReminder}`
  ].join("\n");
}
