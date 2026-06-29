import type { TranslationResult } from "@/types/report";

export function exportAmazonEnglishListing(translation: TranslationResult) {
  return [
    `Amazon-style Listing | ${translation.sections.productTitle}`,
    "",
    "Product Title",
    translation.sections.productTitle,
    "",
    "Key Product Bullets",
    translation.sections.keySellingPoints,
    "",
    "Product Description",
    translation.sections.longDescription,
    "",
    "Search Terms",
    translation.sections.seoKeywords,
    "",
    "Customer Questions",
    translation.sections.faqs,
    "",
    "Risk Notes",
    translation.sections.legalRiskNotes
  ].join("\n");
}
