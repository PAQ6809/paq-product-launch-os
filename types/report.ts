export type LaunchReportInput = {
  productName: string;
  category: string;
  features: string;
  cost: number;
  targetPrice: number;
  targetAudience: string;
  brandStyle: string;
  salesChannels: string[];
  imageUrl: string;
};

export type CompetitorInsight = {
  name: string;
  positioning: string;
  priceRange: string;
  strength: string;
  gap: string;
};

export type PricingStrategy = {
  suggestedPrice: number;
  floorPrice: number;
  premiumPrice: number;
  marginRate: number;
  rationale: string;
  promoNotes: string;
};

export type PackagingBrief = {
  concept: string;
  visualDirection: string;
  materials: string;
  requiredElements: string[];
  complianceNotes: string[];
};

export type SocialPost = {
  platform: "IG" | "Threads" | "TikTok";
  caption: string;
  hashtags: string[];
  cta: string;
};

export type VideoScript = {
  title: string;
  durationSeconds: number;
  hook: string;
  scenes: string[];
  cta: string;
};

export type FAQ = {
  question: string;
  answer: string;
};

export type CustomerServiceScript = {
  scenario: string;
  response: string;
};

export type LaunchChecklistItem = {
  phase: string;
  task: string;
  ownerHint: string;
};

export type FirstMonthMarketingPlanItem = {
  week: string;
  focus: string;
  actions: string[];
  metric: string;
};

export type OptimizationSuggestion = {
  signal: string;
  action: string;
  why: string;
};

export type LaunchReport = {
  productName: string;
  category: string;
  generatedAt: string;
  isMock: boolean;
  positioning: string;
  targetAudienceAnalysis: string;
  keySellingPoints: string[];
  competitorAnalysis: CompetitorInsight[];
  pricingStrategy: PricingStrategy;
  packagingBrief: PackagingBrief;
  frontPackagingCopy: string;
  backPackagingCopy: string;
  productTitle: string;
  shortDescription: string;
  longDescription: string;
  seoKeywords: string[];
  socialPosts: SocialPost[];
  videoScripts: VideoScript[];
  faqs: FAQ[];
  customerServiceScripts: CustomerServiceScript[];
  launchChecklist: LaunchChecklistItem[];
  firstMonthMarketingPlan: FirstMonthMarketingPlanItem[];
  optimizationSuggestions: OptimizationSuggestion[];
  legalRiskNotes: string[];
};

export type TranslationProviderName = "mock" | "openai" | "nvidia";
export type TranslationLocale = "zh-TW" | "en" | "ja" | "ko" | "ar";

export type TranslationSectionKey =
  | "positioning"
  | "targetAudienceAnalysis"
  | "keySellingPoints"
  | "competitorAnalysis"
  | "pricingStrategy"
  | "packagingBrief"
  | "frontPackagingCopy"
  | "backPackagingCopy"
  | "productTitle"
  | "shortDescription"
  | "longDescription"
  | "seoKeywords"
  | "socialPosts"
  | "videoScripts"
  | "faqs"
  | "customerServiceScripts"
  | "launchChecklist"
  | "firstMonthMarketingPlan"
  | "optimizationSuggestions"
  | "legalRiskNotes";

export type TranslationSections = Record<TranslationSectionKey, string>;

export type TranslationResult = {
  sourceLocale: TranslationLocale;
  targetLocale: TranslationLocale;
  translatedAt: string;
  provider: TranslationProviderName;
  model: string;
  isFallback: boolean;
  warning?: string;
  sections: TranslationSections;
};
