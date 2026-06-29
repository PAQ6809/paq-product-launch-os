import { buildTranslationSourceSections } from "@/lib/translation/translation-sections";
import { assertValidTranslationResult } from "@/lib/translation/validators/translation-result-validator";
import type { TranslationOptions, TranslationProvider } from "@/lib/translation/provider";
import type { LaunchReport, TranslationLocale, TranslationResult, TranslationSections } from "@/types/report";

export class MockTranslationProvider implements TranslationProvider {
  readonly name = "mock" as const;
  readonly model = "paq-mock-localizer-v1";

  async translateLaunchReport(report: LaunchReport, options: TranslationOptions): Promise<TranslationResult> {
    const sections = getMockSections(report, options.targetLocale);

    return assertValidTranslationResult({
      sourceLocale: options.sourceLocale,
      targetLocale: options.targetLocale,
      translatedAt: new Date().toISOString(),
      provider: "mock",
      model: this.model,
      isFallback: false,
      warning: "Mock translation is used for the demo flow. Review all localized copy before external use.",
      sections
    });
  }
}

function getMockSections(report: LaunchReport, targetLocale: TranslationLocale): TranslationSections {
  if (targetLocale !== "en") {
    return genericLocalizedTranslation(report, targetLocale);
  }

  const name = report.productName.toLowerCase();

  if (name.includes("arcsnap")) {
    return arcSnapTranslation();
  }

  if (name.includes("after rain")) {
    return afterRainTranslation();
  }

  if (report.productName.includes("島嶼") || report.productName.includes("書籤")) {
    return islandBookmarkTranslation();
  }

  return genericTranslation(report);
}

function genericLocalizedTranslation(report: LaunchReport, targetLocale: TranslationLocale): TranslationSections {
  const source = buildTranslationSourceSections(report);
  const labels: Record<TranslationLocale, string> = {
    "zh-TW": "繁體中文示範",
    en: "English demo translation",
    ja: "日本語デモ翻訳",
    ko: "한국어 데모 번역",
    ar: "ترجمة تجريبية بالعربية"
  };
  const prefix = labels[targetLocale];

  // ponytail: mock mode preserves every source fact; real linguistic localization is delegated to the configured AI provider.
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, `${prefix}\n\n${value}`])
  ) as TranslationSections;
}

function islandBookmarkTranslation(): TranslationSections {
  return {
    positioning:
      "A paper-textured bookmark set positioned as a refined stationery gift, designed for readers, stationery lovers, and buyers looking for a quiet everyday object with a local design story.",
    targetAudienceAnalysis:
      "The target audience values texture, gifting intent, and a sense of place. They are likely to browse Pinkoi or Instagram and compare products by visual style, story, material feel, and gift readiness.",
    keySellingPoints:
      "1. Clear gifting scenario for readers and stationery fans.\n2. Paper texture and island-inspired visual language create a memorable tactile identity.\n3. Suitable for Pinkoi, IG content, school projects, and small-brand gift sets.",
    competitorAnalysis:
      "1. Mass-market bookmarks: affordable but less distinctive.\n2. Illustration stationery brands: visually strong but sometimes lack a clear gift message.\n3. Local souvenir products: strong story value, but the packaging and product page need clearer usage context.",
    pricingStrategy:
      "Suggested price: NT$320. The price should be justified through material texture, illustration, packaging, and gifting value instead of discounting. Introductory bundles can be tested without weakening the brand position.",
    packagingBrief:
      "Use a clean paper-based package with a calm editorial layout. Prioritize the product name, texture story, content quantity, usage note, and gift-ready presentation. Confirm rights for illustrations, fonts, and photography before production.",
    frontPackagingCopy: "Island Paper Bookmark Set\nA quiet paper-textured gift for readers and stationery lovers.",
    backPackagingCopy:
      "Designed for everyday reading, gifting, and small moments of collection. Review all printed copy, material descriptions, and artwork rights before production.",
    productTitle: "Island Paper Bookmark Set | Textured Stationery Gift",
    shortDescription:
      "A paper-textured bookmark set for readers, stationery lovers, and thoughtful gifting occasions.",
    longDescription:
      "The Island Paper Bookmark Set turns a small reading tool into a tactile stationery gift. Its value comes from paper texture, visual storytelling, and a gift-ready presentation that works well for Pinkoi, Instagram, and small-brand retail displays.",
    seoKeywords:
      "paper bookmark, stationery gift, reading gift, textured paper, local design, Pinkoi gift, bookmark set",
    socialPosts:
      "[IG]\nA small paper object for people who still love the ritual of reading. The Island Paper Bookmark Set is designed as a quiet stationery gift with texture, story, and everyday use.\n#stationerygift #bookmarkset #localdesign\nCTA: Save this for your next gift list.",
    videoScripts:
      "1. 20-second stationery close-up\nHook: A bookmark can be more than a placeholder.\nScene 1: Show the paper texture.\nScene 2: Place it inside a book.\nScene 3: Show the package as a gift.\nCTA: View the full set and gifting details.",
    faqs:
      "Q: Who is this for?\nA: It is suitable for readers, stationery collectors, and buyers looking for a small, thoughtful gift.\n\nQ: Can the copy be used directly?\nA: It should be reviewed before publishing, especially material descriptions and artwork rights.",
    customerServiceScripts:
      "Scenario: A customer asks whether it is suitable as a gift.\nResponse: Yes, this set is designed for readers and stationery lovers. Please review the product details and package contents before ordering.",
    launchChecklist:
      "1. Confirm product quantity and material description.\n2. Review packaging copy and artwork rights.\n3. Prepare Pinkoi and IG listing assets.\n4. Add FAQ and gifting notes before launch.",
    firstMonthMarketingPlan:
      "Week 1: Build anticipation with texture photos and reading scenes.\nWeek 2: Launch on Pinkoi and Instagram.\nWeek 3: Collect questions and update FAQ.\nWeek 4: Test gift bundles and seasonal messaging.",
    optimizationSuggestions:
      "Track saves, product page clicks, and gifting-related questions. If people like the visuals but do not purchase, improve package photos, gift scenarios, and product quantity clarity.",
    legalRiskNotes:
      "Human review is required before external use. Confirm commercial rights for illustrations, fonts, photos, and packaging materials. Check platform rules before listing."
  };
}

function arcSnapTranslation(): TranslationSections {
  return {
    positioning:
      "ArcSnap MagSafe Slim Power Bank is positioned as a practical, design-conscious 3C accessory that translates technical specifications into everyday charging efficiency.",
    targetAudienceAnalysis:
      "The primary audience includes frequent commuters, iPhone users, mobile workers, and buyers who care about clean desk setups and premium everyday carry items.",
    keySellingPoints:
      "1. Clear use case for commuting and short trips.\n2. MagSafe compatibility and slim form factor make the benefit easy to understand.\n3. The pricing can be supported by material feel, usability, and after-sales clarity.",
    competitorAnalysis:
      "1. Value-focused accessory brands: strong price appeal but weaker brand story.\n2. Marketplace bestsellers: visible and competitive, but often rely heavily on price.\n3. Design-led tech stores: strong visuals, but product specifications and FAQ must be clearer.",
    pricingStrategy:
      "Suggested price: NT$1,290. The launch should avoid long-term discounting and instead explain capacity, compatibility, material quality, safety notes, and support.",
    packagingBrief:
      "Use a clean, specification-led package with clear icons, restrained color, and direct hierarchy. Include product name, key specs, compatibility notes, charging information, warranty or support entry, and required platform labels.",
    frontPackagingCopy: "ArcSnap MagSafe Slim Power Bank\nSlim magnetic power for daily iPhone carry.",
    backPackagingCopy:
      "Built for commuting, short trips, and daily backup power. Confirm capacity, compatibility, safety notes, certifications, and platform requirements before publishing.",
    productTitle: "ArcSnap MagSafe Slim Power Bank | Magnetic Fast-charge 3C Accessory",
    shortDescription:
      "A slim MagSafe-compatible power bank for iPhone users who need lightweight backup power on the move.",
    longDescription:
      "ArcSnap MagSafe Slim Power Bank brings charging back into real daily use. It focuses on a lightweight magnetic form factor, practical commuting scenarios, and clear product information so buyers can understand fit, price, and difference from similar accessories.",
    seoKeywords:
      "MagSafe power bank, slim power bank, iPhone accessory, magnetic charger, fast charging, 3C accessory",
    socialPosts:
      "[IG]\nFor days when your phone has to keep up with your schedule. ArcSnap keeps the message simple: slim magnetic backup power for daily carry.\n#MagSafe #powerbank #iPhoneAccessory\nCTA: View the full specs before launch.",
    videoScripts:
      "1. 25-second commute demo\nHook: Low battery before the next meeting?\nScene 1: Show the commute situation.\nScene 2: Snap the power bank onto the phone.\nScene 3: Show slim carry and product specs.\nCTA: Check the listing for compatibility and details.",
    faqs:
      "Q: Who is it for?\nA: It is for iPhone users who need lightweight backup power during commuting, travel, or workdays.\n\nQ: What should be reviewed before publishing?\nA: Capacity, compatibility, safety information, certifications, and platform listing requirements.",
    customerServiceScripts:
      "Scenario: A customer asks whether it fits their phone.\nResponse: Please check the compatibility notes on the product page. If you share your phone model, we can help confirm the fit before purchase.",
    launchChecklist:
      "1. Confirm capacity, compatibility, and safety details.\n2. Prepare product photos and specification icons.\n3. Update Shopify, Shopee, and TikTok Shop listing copy.\n4. Review warranty, logistics, and return information.",
    firstMonthMarketingPlan:
      "Week 1: Build awareness with commuting and desk setup content.\nWeek 2: Launch product pages and short video demos.\nWeek 3: Update FAQ based on customer questions.\nWeek 4: Optimize first image, title, and conversion path.",
    optimizationSuggestions:
      "If product page visits are high but conversion is low, improve compatibility information, charging details, product photos, and trust signals.",
    legalRiskNotes:
      "Review all specifications, safety statements, compatibility claims, certifications, and platform rules before listing. Do not imply outcomes that the product information does not support."
  };
}

function afterRainTranslation(): TranslationSections {
  return {
    positioning:
      "After Rain Aroma Gift Set is positioned as a lifestyle fragrance gift set that communicates atmosphere, ritual, and gifting value without making wellness or therapeutic claims.",
    targetAudienceAnalysis:
      "The audience includes buyers who enjoy home fragrance, calm visual styling, and gift-ready lifestyle products. They respond to mood, scent story, packaging, and clear usage guidance.",
    keySellingPoints:
      "1. Strong gifting scenario for home and lifestyle buyers.\n2. The scent story can be communicated through mood and ritual instead of functional claims.\n3. Packaging and product page copy should emphasize atmosphere, contents, and usage notes.",
    competitorAnalysis:
      "1. Affordable fragrance sets: easy to buy but less distinctive.\n2. Lifestyle gift brands: visually strong but often need clearer contents and usage notes.\n3. Premium aroma products: strong atmosphere, but price needs packaging and story support.",
    pricingStrategy:
      "Suggested price: NT$880. The price should be explained through packaging, scent concept, gift readiness, and the complete set experience rather than performance claims.",
    packagingBrief:
      "Use a soft, clean package with restrained color, scent notes, contents, usage instructions, and safety reminders. All fragrance-related language should avoid therapeutic or health-effect claims.",
    frontPackagingCopy: "After Rain Aroma Gift Set\nA calm fragrance ritual for home and gifting.",
    backPackagingCopy:
      "Created for atmospheric home moments and thoughtful gifting. Review scent descriptions, ingredient or material notes, safety guidance, and platform rules before launch.",
    productTitle: "After Rain Aroma Gift Set | Home Fragrance and Lifestyle Gift",
    shortDescription:
      "A gift-ready home fragrance set built around a calm after-rain atmosphere and everyday ritual.",
    longDescription:
      "After Rain Aroma Gift Set presents fragrance as a lifestyle and gifting experience. The launch copy should focus on scent mood, package presentation, contents, and usage guidance while avoiding health, wellness, or therapeutic claims.",
    seoKeywords:
      "home fragrance gift, aroma gift set, diffuser gift, lifestyle fragrance, scent gift, Pinkoi gift",
    socialPosts:
      "[IG]\nA quiet scent story for the moment after the rain. After Rain is designed as a gift-ready home fragrance set with calm packaging and clear usage notes.\n#homefragrance #giftset #lifestylegift\nCTA: Save it for your next gifting moment.",
    videoScripts:
      "1. 30-second mood video\nHook: What should a quiet home moment feel like?\nScene 1: Show the package opening.\nScene 2: Show the product in a room setting.\nScene 3: Show scent notes and usage guidance.\nCTA: View the full gift set details.",
    faqs:
      "Q: Is this a wellness or medical product?\nA: No. It is positioned as a home fragrance and lifestyle gift product. Do not use health-effect or therapeutic claims.\n\nQ: What must be checked before listing?\nA: Scent descriptions, contents, safety notes, image rights, and platform rules.",
    customerServiceScripts:
      "Scenario: A customer asks about scent effect.\nResponse: This product is designed to create an atmospheric home fragrance experience. Please refer to the scent notes and usage guidance rather than expecting health-related effects.",
    launchChecklist:
      "1. Confirm scent notes, contents, and usage instructions.\n2. Review packaging copy and safety notes.\n3. Prepare gift-ready product photos.\n4. Check platform rules for fragrance-related wording.",
    firstMonthMarketingPlan:
      "Week 1: Build mood and scent story content.\nWeek 2: Launch product page and gift-oriented posts.\nWeek 3: Collect questions and refine FAQ.\nWeek 4: Test gift bundle messaging and visual variants.",
    optimizationSuggestions:
      "If engagement is high but purchase intent is unclear, strengthen gift scenarios, contents clarity, product photos, and scent description structure.",
    legalRiskNotes:
      "Human review is required for fragrance copy. Avoid health, wellness, therapeutic, or body-effect claims. Confirm image rights, packaging labels, safety notes, and platform rules."
  };
}

function genericTranslation(report: LaunchReport): TranslationSections {
  const source = buildTranslationSourceSections(report);

  return {
    positioning: `Professional English positioning draft for ${report.productName}: ${source.positioning}`,
    targetAudienceAnalysis: `Target audience translation draft: ${source.targetAudienceAnalysis}`,
    keySellingPoints: `Key selling points translation draft:\n${source.keySellingPoints}`,
    competitorAnalysis: `Competitor analysis translation draft:\n${source.competitorAnalysis}`,
    pricingStrategy: `Pricing strategy translation draft:\n${source.pricingStrategy}`,
    packagingBrief: `Packaging brief translation draft:\n${source.packagingBrief}`,
    frontPackagingCopy: `Front packaging copy translation draft:\n${source.frontPackagingCopy}`,
    backPackagingCopy: `Back packaging copy translation draft:\n${source.backPackagingCopy}`,
    productTitle: `${report.productName} | Product Launch Listing Draft`,
    shortDescription: `English short description draft for ${report.productName}.`,
    longDescription: `English long description draft for ${report.productName}. Review against the original Traditional Chinese report before external use.`,
    seoKeywords: source.seoKeywords,
    socialPosts: `Social post translation draft:\n${source.socialPosts}`,
    videoScripts: `Video script translation draft:\n${source.videoScripts}`,
    faqs: `FAQ translation draft:\n${source.faqs}`,
    customerServiceScripts: `Customer service script translation draft:\n${source.customerServiceScripts}`,
    launchChecklist: `Launch checklist translation draft:\n${source.launchChecklist}`,
    firstMonthMarketingPlan: `First-month marketing plan translation draft:\n${source.firstMonthMarketingPlan}`,
    optimizationSuggestions: `Optimization suggestions translation draft:\n${source.optimizationSuggestions}`,
    legalRiskNotes:
      "Human review is required before external use. Confirm product facts, commercial rights, platform rules, and regulated-category wording."
  };
}
