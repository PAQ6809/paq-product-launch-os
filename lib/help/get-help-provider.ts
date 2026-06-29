import "server-only";

import { MockHelpProvider } from "@/lib/help/mock-help-provider";
import { NvidiaHelpProvider } from "@/lib/help/nvidia-help-provider";
import type { HelpProvider, HelpProviderName } from "@/lib/help/provider";

export type SelectedHelpProvider = {
  provider: HelpProvider;
  requestedProvider: HelpProviderName;
  publicHelpAIEnabled: boolean;
  forcedMockInProduction: boolean;
  warning?: string;
};

export function getHelpProvider(): SelectedHelpProvider {
  const requestedProvider = normalizeProviderName(process.env.HELP_AI_PROVIDER);
  const publicHelpAIEnabled = process.env.ENABLE_PUBLIC_HELP_AI === "true";
  const forcedMockInProduction =
    process.env.NODE_ENV === "production" && !publicHelpAIEnabled && requestedProvider !== "mock";

  if (requestedProvider === "nvidia") {
    if (forcedMockInProduction) {
      return mockSelection(
        requestedProvider,
        publicHelpAIEnabled,
        true,
        "Public Help AI is disabled in production. Forced fallback to MockHelpProvider."
      );
    }

    if (!publicHelpAIEnabled) {
      return mockSelection(
        requestedProvider,
        publicHelpAIEnabled,
        false,
        "HELP_AI_PROVIDER=nvidia but ENABLE_PUBLIC_HELP_AI is not true. Fallback to MockHelpProvider."
      );
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return mockSelection(
        requestedProvider,
        publicHelpAIEnabled,
        false,
        "HELP_AI_PROVIDER=nvidia but NVIDIA_API_KEY is missing. Fallback to MockHelpProvider."
      );
    }

    return {
      provider: new NvidiaHelpProvider({
        apiKey,
        model: process.env.NVIDIA_MODEL,
        requestTimeoutMs: parseOptionalNumber(process.env.NVIDIA_TIMEOUT_MS)
      }),
      requestedProvider,
      publicHelpAIEnabled,
      forcedMockInProduction: false
    };
  }

  return mockSelection("mock", publicHelpAIEnabled, false);
}

function mockSelection(
  requestedProvider: HelpProviderName,
  publicHelpAIEnabled: boolean,
  forcedMockInProduction: boolean,
  warning?: string
): SelectedHelpProvider {
  return {
    provider: new MockHelpProvider(),
    requestedProvider,
    publicHelpAIEnabled,
    forcedMockInProduction,
    warning
  };
}

function normalizeProviderName(value: string | undefined): HelpProviderName {
  return value === "nvidia" ? "nvidia" : "mock";
}

function parseOptionalNumber(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
