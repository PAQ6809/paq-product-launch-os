import type { LaunchReport, TranslationLocale, TranslationProviderName, TranslationResult } from "@/types/report";

export type TranslationOptions = {
  sourceLocale: TranslationLocale;
  targetLocale: TranslationLocale;
  productCategory?: string;
};

export type TranslationProvider = {
  name: TranslationProviderName;
  model: string;
  translateLaunchReport(report: LaunchReport, options: TranslationOptions): Promise<TranslationResult>;
};

export type TranslateReportApiResponse = {
  translation: TranslationResult;
  provider: TranslationProviderName;
  requestedProvider: TranslationProviderName;
  isFallback: boolean;
  warning?: string;
  model: string;
  generatedAt: string;
  validationPassed: boolean;
  durationMs: number;
};
