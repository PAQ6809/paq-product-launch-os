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

export type AnalysisConfidenceLevel = "low" | "medium" | "high";

export type RealAINextAction = {
  priority: "high" | "medium" | "low";
  action: string;
  reason: string;
  expectedImpact: string;
  effort: string;
};

export type RealAIProductAnalysis = {
  executiveSummary: {
    summary: string;
    keyOpportunities: string[];
    keyRisks: string[];
    strongestAngle: string;
    weakestPoint: string;
  };
  productDiagnosis: {
    insight: string;
    reasoning: string;
    assumptions: string[];
    missingInformation: string[];
    recommendations: string[];
  };
  positioningAnalysis: {
    primaryPositioning: string;
    alternativePositioning: string;
    whyThisWorks: string;
    whoItIsNotFor: string;
    risks: string[];
  };
  targetAudience: {
    primarySegment: string;
    secondarySegment: string;
    painPoints: string[];
    buyingTriggers: string[];
    objections: string[];
    messagingAngle: string;
  };
  competitiveStrategy: {
    likelyCompetitors: string[];
    differentiation: string[];
    defensibility: string;
    comparisonTable: Array<{
      factor: string;
      paqProduct: string;
      competitorPattern: string;
      opportunity: string;
    }>;
    risks: string[];
  };
  pricingAnalysis: {
    suggestedPriceRange: string;
    reasoning: string;
    marginNotes: string;
    discountStrategy: string;
    riskNotes: string[];
  };
  packagingStrategy: {
    packagingConcept: string;
    visualDirection: string;
    copyDirection: string;
    unboxingMoment: string;
    costRisk: string;
  };
  listingCopy: {
    title: string;
    subtitle: string;
    bullets: string[];
    description: string;
    seoKeywords: string[];
    complianceWarnings: string[];
  };
  marketingPlan: {
    first7Days: string[];
    first30Days: string[];
    channelStrategy: string;
    contentThemes: string[];
    launchChecklist: string[];
  };
  socialContent: {
    posts: string[];
    shortVideoScripts: string[];
    creatorBrief: string;
  };
  customerSupport: {
    faq: string[];
    objectionHandling: string[];
    replyScripts: string[];
  };
  legalRiskAssessment: {
    riskyClaims: string[];
    saferAlternatives: string[];
    requiredDisclaimers: string[];
    reviewNeeded: boolean;
  };
  nextActions: RealAINextAction[];
};

export type LaunchReportMetadata = {
  provider: "mock" | "openai" | "nvidia";
  model: string;
  isAiGenerated: boolean;
  isFallback: boolean;
  generatedAt: string;
  assumptionsUsed: string[];
  confidenceLevel: AnalysisConfidenceLevel;
  validationPassed: boolean;
  warnings?: string[];
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
  analysis?: RealAIProductAnalysis;
  metadata?: LaunchReportMetadata;
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
