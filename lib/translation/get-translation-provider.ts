import "server-only";

import { MockTranslationProvider } from "@/lib/translation/mock-translation-provider";
import { AITranslationProvider } from "@/lib/translation/ai-translation-provider";
import type { TranslationProvider } from "@/lib/translation/provider";
import type { TranslationProviderName } from "@/types/report";

export type SelectedTranslationProvider = {
  provider: TranslationProvider;
  requestedProvider: TranslationProviderName;
  warning?: string;
};

export function getTranslationProvider(preference?: TranslationProviderName): SelectedTranslationProvider {
  const requestedProvider = preference ?? normalizeProviderName(process.env.TRANSLATION_PROVIDER);

  if (requestedProvider === "openai") {
    if (process.env.OPENAI_API_KEY) {
      return {
        provider: new AITranslationProvider({
          name: "openai",
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
          requestTimeoutMs: parseOptionalNumber(process.env.OPENAI_TIMEOUT_MS)
        }),
        requestedProvider
      };
    }

    return {
      provider: new MockTranslationProvider(),
      requestedProvider,
      warning: "TRANSLATION_PROVIDER=openai but OPENAI_API_KEY is missing. Fallback to MockTranslationProvider."
    };
  }

  if (requestedProvider === "nvidia") {
    if (process.env.NVIDIA_API_KEY) {
      return {
        provider: new AITranslationProvider({
          name: "nvidia",
          apiKey: process.env.NVIDIA_API_KEY,
          model: process.env.NVIDIA_MODEL ?? "minimaxai/minimax-m2.7",
          requestTimeoutMs: parseOptionalNumber(process.env.NVIDIA_TIMEOUT_MS)
        }),
        requestedProvider
      };
    }
    return { provider: new MockTranslationProvider(), requestedProvider, warning: "NVIDIA_API_KEY is missing. Fallback to MockTranslationProvider." };
  }

  return {
    provider: new MockTranslationProvider(),
    requestedProvider
  };
}

function normalizeProviderName(value: string | undefined): TranslationProviderName {
  return value === "openai" || value === "nvidia" ? value : "mock";
}

function parseOptionalNumber(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
