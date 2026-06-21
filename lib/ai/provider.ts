import type { LaunchReport, LaunchReportInput } from "@/types/report";

export type AIProviderName = "mock" | "openai";

export type GenerateLaunchReportInput = LaunchReportInput;

export type GenerateLaunchReportOptions = {
  requestId?: string;
  userId?: string;
  productId?: string;
  model?: string;
};

export type AIProvider = {
  name: AIProviderName;
  generateLaunchReport(
    input: GenerateLaunchReportInput,
    options?: GenerateLaunchReportOptions
  ): Promise<LaunchReport>;
};

export type GenerateReportApiResponse = {
  report: LaunchReport;
  provider: AIProviderName;
  requestedProvider: AIProviderName;
  isFallback: boolean;
  isAiGenerated: true;
  warning?: string;
  validationErrors?: string[];
};
