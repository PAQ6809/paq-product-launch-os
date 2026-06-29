import "server-only";

import { HELP_SYSTEM_PROMPT } from "@/lib/help/help-system-prompt";
import { buildHelpUserPrompt } from "@/lib/help/help-user-prompt";
import { parseHelpAnswerJson } from "@/lib/help/help-response-validator";
import type { HelpAnswer, HelpProvider, HelpQuestionInput } from "@/lib/help/provider";

const NVIDIA_CHAT_COMPLETIONS_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_NVIDIA_MODEL = "minimaxai/minimax-m2.7";

type NvidiaHelpProviderConfig = {
  apiKey: string;
  model?: string;
  requestTimeoutMs?: number;
};

type NvidiaResponsePayload = {
  choices?: unknown;
};

export class NvidiaHelpProvider implements HelpProvider {
  readonly name = "nvidia" as const;
  readonly model: string;
  private readonly apiKey: string;
  private readonly requestTimeoutMs: number;

  constructor(config: NvidiaHelpProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_NVIDIA_MODEL;
    this.requestTimeoutMs = config.requestTimeoutMs ?? 45_000;
  }

  async answerHelpQuestion(input: HelpQuestionInput): Promise<HelpAnswer> {
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await fetch(NVIDIA_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: HELP_SYSTEM_PROMPT },
            { role: "user", content: buildHelpUserPrompt(input) }
          ],
          temperature: 0.2,
          top_p: 0.7,
          max_tokens: 1200,
          stream: false
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NVIDIA Help API error ${response.status}: ${errorText.slice(0, 300)}`);
      }

      const content = extractAssistantText((await response.json()) as NvidiaResponsePayload);
      const validation = parseHelpAnswerJson(content);

      if (!validation.ok) {
        throw new Error(`Help answer validation failed: ${validation.errors.join("; ")}`);
      }

      return {
        ...validation.answer,
        provider: this.name,
        model: this.model,
        isFallback: false,
        relatedLinks: validation.answer.relatedLinks.length > 0 ? validation.answer.relatedLinks : input.relatedLinks,
        answeredAt: validation.answer.answeredAt || new Date().toISOString()
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function extractAssistantText(payload: NvidiaResponsePayload) {
  if (!Array.isArray(payload.choices) || payload.choices.length === 0) {
    throw new Error("NVIDIA Help response did not include choices.");
  }

  const firstChoice = payload.choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    throw new Error("NVIDIA Help response did not include an assistant message.");
  }

  const content = firstChoice.message.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("NVIDIA Help assistant message was empty.");
  }

  return content;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
