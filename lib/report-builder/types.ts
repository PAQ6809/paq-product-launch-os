import type { AIProviderName } from "@/lib/ai/provider";
import type { Product } from "@/types";
import type { LaunchReport } from "@/types/report";

export type ProductAnalysisTemplateSectionId =
  | "cover"
  | "executive-summary"
  | "product-profile"
  | "market-positioning"
  | "competitive-analysis"
  | "pricing-strategy"
  | "packaging-strategy"
  | "listing-copy"
  | "marketing-assets"
  | "customer-communication"
  | "risk-and-compliance"
  | "next-actions"
  | "appendix";

export type ReportTemplateSection = {
  id: ProductAnalysisTemplateSectionId;
  title: string;
  items: string[];
};

export type ProductAnalysisTemplate = {
  id: "product-analysis-v1";
  title: string;
  sections: ReportTemplateSection[];
};

export type ReportBuilderMetadata = {
  provider?: AIProviderName;
  model?: string;
  validationPassed?: boolean;
  reviewerNotes?: string;
  exportedBy?: string;
  exportedAt?: string;
};

export type NormalizedProductAnalysisReport = {
  templateId: ProductAnalysisTemplate["id"];
  title: string;
  productName: string;
  preparedFor: string;
  generatedAt: string;
  confidentialityNotice: string;
  sections: ReportTemplateSection[];
  source: {
    product: Product;
    report: LaunchReport;
    metadata: ReportBuilderMetadata;
  };
};
