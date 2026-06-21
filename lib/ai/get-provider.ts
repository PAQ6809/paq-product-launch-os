import "server-only";

import { MockAIProvider } from "@/lib/ai/mock-provider";
import { OpenAIProvider } from "@/lib/ai/openai-provider";
import type { AIProvider, AIProviderName } from "@/lib/ai/provider";

export type SelectedAIProvider = {
  provider: AIProvider;
  requestedProvider: AIProviderName;
  warning?: string;
};

export function getAIProvider(): SelectedAIProvider {
  const requestedProvider = normalizeProviderName(process.env.AI_PROVIDER);
  const apiKey = process.env.OPENAI_API_KEY;

  if (requestedProvider === "openai") {
    if (apiKey) {
      return {
        provider: new OpenAIProvider({
          apiKey,
          model: process.env.OPENAI_MODEL,
          requestTimeoutMs: parseOptionalNumber(process.env.OPENAI_TIMEOUT_MS)
        }),
        requestedProvider
      };
    }

    return {
      provider: new MockAIProvider(),
      requestedProvider,
      warning: "AI_PROVIDER=openai but OPENAI_API_KEY is missing. Fallback to MockAIProvider."
    };
  }

  return {
    provider: new MockAIProvider(),
    requestedProvider
  };
}

function normalizeProviderName(value: string | undefined): AIProviderName {
  return value === "openai" ? "openai" : "mock";
}

function parseOptionalNumber(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
