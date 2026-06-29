import type { TranslationResult } from "@/types/report";

export function exportShopifyEnglishListing(translation: TranslationResult) {
  return [
    `Shopify Product Listing | ${translation.sections.productTitle}`,
    "",
    "Title",
    translation.sections.productTitle,
    "",
    "Short Description",
    translation.sections.shortDescription,
    "",
    "Product Description",
    translation.sections.longDescription,
    "",
    "SEO Keywords",
    translation.sections.seoKeywords,
    "",
    "FAQ",
    translation.sections.faqs,
    "",
    "Compliance Reminder",
    translation.sections.legalRiskNotes
  ].join("\n");
}
