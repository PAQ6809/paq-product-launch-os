import type { LaunchReport } from "@/types/report";
import { formatCurrency } from "@/lib/utils";

const legalReminder =
  "上架提醒：此 Shopify 模板不會呼叫 Shopify API。請人工確認商品事實、庫存、物流、稅務、商標、圖片授權與平台規則；食品、美妝、醫療、保健品不得使用未經證實的療效宣稱。";

export function exportShopifyProductTemplate(report: LaunchReport) {
  return [
    `Shopify Product Template｜${report.productName}`,
    "",
    "Title",
    report.productTitle,
    "",
    "Description HTML / Rich text",
    `<p>${report.shortDescription}</p>`,
    `<p>${report.longDescription}</p>`,
    "<h3>Key selling points</h3>",
    "<ul>",
    ...report.keySellingPoints.map((point) => `<li>${point}</li>`),
    "</ul>",
    "<h3>FAQ</h3>",
    ...report.faqs.map((faq) => `<p><strong>${faq.question}</strong><br/>${faq.answer}</p>`),
    "",
    "SEO",
    `SEO title: ${report.productTitle}`,
    `SEO description: ${report.shortDescription}`,
    `Tags: ${report.seoKeywords.join(", ")}`,
    "",
    "Pricing",
    `Suggested price: ${formatCurrency(report.pricingStrategy.suggestedPrice)}`,
    `Floor price: ${formatCurrency(report.pricingStrategy.floorPrice)}`,
    `Premium bundle price: ${formatCurrency(report.pricingStrategy.premiumPrice)}`,
    "",
    "Metafields draft",
    `category: ${report.category}`,
    `positioning: ${report.positioning}`,
    `packaging_concept: ${report.packagingBrief.concept}`,
    "",
    "Compliance notes",
    ...report.packagingBrief.complianceNotes.map((note) => `- ${note}`),
    `- ${legalReminder}`
  ].join("\n");
}
