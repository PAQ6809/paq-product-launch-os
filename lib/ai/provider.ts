import type { LaunchReport, LaunchReportInput } from "@/types/report";

export type AIProviderName = "mock" | "openai" | "nvidia";

export type GenerateLaunchReportInput = LaunchReportInput;

export type GenerateLaunchReportOptions = {
  requestId?: string;
  userId?: string;
  productId?: string;
  model?: string;
};

export type AIProvider = {
  name: AIProviderName;
  model: string;
  generateLaunchReport(
    input: GenerateLaunchReportInput,
    options?: GenerateLaunchReportOptions
  ): Promise<LaunchReport>;
};

export type RateLimitMetadata = {
  enabled: boolean;
  remaining: number;
  resetAt: string;
};

export type GenerateReportApiResponse = {
  report: LaunchReport;
  provider: AIProviderName;
  requestedProvider: AIProviderName;
  isFallback: boolean;
  isAiGenerated: true;
  model: string;
  generatedAt: string;
  validationPassed: boolean;
  rateLimit: RateLimitMetadata;
  publicRealAIEnabled: boolean;
  forcedMockInProduction: boolean;
  warning?: string;
  validationErrors?: string[];
};
