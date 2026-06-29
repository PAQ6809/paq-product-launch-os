import "server-only";

import { MockAIProvider } from "@/lib/ai/mock-provider";
import { NvidiaProvider } from "@/lib/ai/nvidia-provider";
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

  if (requestedProvider === "nvidia") {
    const nvidiaApiKey = process.env.NVIDIA_API_KEY;

    if (nvidiaApiKey) {
      return {
        provider: new NvidiaProvider({
          apiKey: nvidiaApiKey,
          model: process.env.NVIDIA_MODEL,
          maxTokens: parseOptionalNumber(process.env.NVIDIA_MAX_TOKENS),
          requestTimeoutMs: parseOptionalNumber(process.env.NVIDIA_TIMEOUT_MS)
        }),
        requestedProvider
      };
    }

    return {
      provider: new MockAIProvider(),
      requestedProvider,
      warning: "AI_PROVIDER=nvidia but NVIDIA_API_KEY is missing. Fallback to MockAIProvider."
    };
  }

  return {
    provider: new MockAIProvider(),
    requestedProvider
  };
}

function normalizeProviderName(value: string | undefined): AIProviderName {
  if (value === "openai" || value === "nvidia") {
    return value;
  }

  return "mock";
}

function parseOptionalNumber(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
