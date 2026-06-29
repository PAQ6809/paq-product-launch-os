import type { ReportReviewStatus } from "@/types/review";

export type LifecycleStatus =
  | "idea"
  | "research"
  | "positioning"
  | "packaging"
  | "listing"
  | "marketing"
  | "launched"
  | "optimizing"
  | "archived";

export type ReviewStatus = ReportReviewStatus;

export type RiskLevel = "low" | "medium" | "high";

export type Product = {
  id: string;
  name: string;
  category: string;
  features: string;
  cost: number;
  expectedPrice: number;
  targetAudience: string;
  brandStyle: string;
  salesPlatforms: string[];
  lifecycleStatus: LifecycleStatus;
  imageUrl: string;
  createdAt: string;
  latestReportTitle: string;
  pendingReviewCount: number;
};

export type ReportSection = {
  id: string;
  title: string;
  content: string;
  riskLevel: RiskLevel;
  reviewStatus: ReviewStatus;
  humanEdited?: boolean;
  originalContent?: string;
};

export type NewProductDraft = {
  name: string;
  category: string;
  features: string;
  cost: string;
  expectedPrice: string;
  targetAudience: string;
  brandStyle: string;
  salesChannels: string;
};

export type {
  CompetitorInsight,
  CustomerServiceScript,
  FAQ,
  FirstMonthMarketingPlanItem,
  LaunchChecklistItem,
  LaunchReport,
  LaunchReportInput,
  OptimizationSuggestion,
  PackagingBrief,
  PricingStrategy,
  SocialPost,
  TranslationProviderName,
  TranslationLocale,
  TranslationResult,
  TranslationSectionKey,
  TranslationSections,
  VideoScript
} from "@/types/report";

export type {
  ReportAuditLogEntry,
  ReportReviewStatus,
  ReviewedReportSection,
  ReviewAction
} from "@/types/review";
