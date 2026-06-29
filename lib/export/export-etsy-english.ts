import type { TranslationResult } from "@/types/report";

export function exportEtsyEnglishListing(translation: TranslationResult) {
  return [
    `Etsy-style Listing | ${translation.sections.productTitle}`,
    "",
    "Listing Title",
    translation.sections.productTitle,
    "",
    "Opening Description",
    translation.sections.shortDescription,
    "",
    "Full Description",
    translation.sections.longDescription,
    "",
    "Tags / Keywords",
    translation.sections.seoKeywords,
    "",
    "Shop FAQ",
    translation.sections.faqs,
    "",
    "Review Reminder",
    translation.sections.legalRiskNotes
  ].join("\n");
}
