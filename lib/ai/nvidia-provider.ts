import "server-only";

import { normalizeGeneratedLaunchReport } from "@/lib/ai/normalize-launch-report";
import { PRODUCT_LAUNCH_SYSTEM_PROMPT } from "@/lib/ai/prompts/product-launch-system-prompt";
import { buildProductLaunchUserPrompt } from "@/lib/ai/prompts/product-launch-user-prompt";
import { LAUNCH_REPORT_JSON_SCHEMA } from "@/lib/ai/schemas/launch-report-json-schema";
import {
  assertNoForbiddenMarketingClaims,
  parseLaunchReportJson
} from "@/lib/ai/validators/launch-report-validator";
import type {
  AIProvider,
  GenerateLaunchReportInput,
  GenerateLaunchReportOptions
} from "@/lib/ai/provider";
import type { LaunchReport } from "@/types/report";

const NVIDIA_CHAT_COMPLETIONS_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_NVIDIA_MODEL = "minimaxai/minimax-m2.7";

type NvidiaProviderConfig = {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  requestTimeoutMs?: number;
};

type NvidiaResponsePayload = {
  choices?: unknown;
};

export class NvidiaProvider implements AIProvider {
  readonly name = "nvidia" as const;
  readonly model: string;
  private readonly apiKey: string;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly requestTimeoutMs: number;

  constructor(config: NvidiaProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_NVIDIA_MODEL;
    this.temperature = config.temperature ?? 0.1;
    this.maxTokens = config.maxTokens ?? 4_096;
    this.requestTimeoutMs = config.requestTimeoutMs ?? 150_000;
  }

  async generateLaunchReport(
    input: GenerateLaunchReportInput,
    options: GenerateLaunchReportOptions = {}
  ): Promise<LaunchReport> {
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
          model: options.model ?? this.model,
          messages: [
            {
              role: "system",
              content: `${PRODUCT_LAUNCH_SYSTEM_PROMPT}\n請呼叫 submit_launch_report function 一次，將完整 LaunchReport 放入 arguments。`
            },
            {
              role: "user",
              content: buildProductLaunchUserPrompt(input, {
                provider: "nvidia",
                model: options.model ?? this.model
              })
            }
          ],
          temperature: this.temperature,
          top_p: 0.7,
          max_tokens: this.maxTokens,
          tools: [
            {
              type: "function",
              function: {
                name: "submit_launch_report",
                description: "Submit one complete PAQ Product Launch OS LaunchReport.",
                parameters: LAUNCH_REPORT_JSON_SCHEMA
              }
            }
          ],
          tool_choice: "auto",
          stream: false
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NVIDIA API error ${response.status}: ${errorText.slice(0, 500)}`);
      }

      const payload = (await response.json()) as NvidiaResponsePayload;
      const rawText = extractStructuredPayload(payload);
      const report = parseJsonCandidate(rawText);
      const normalized = normalizeGeneratedLaunchReport(report, input, {
        isMock: false,
        provider: "nvidia",
        model: options.model ?? this.model,
        validationPassed: true
      });
      assertNoForbiddenMarketingClaims(normalized);
      return normalized;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function extractStructuredPayload(payload: NvidiaResponsePayload) {
  if (!Array.isArray(payload.choices) || payload.choices.length === 0) {
    throw new Error("NVIDIA response did not include choices.");
  }

  const firstChoice = payload.choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    throw new Error("NVIDIA response did not include an assistant message.");
  }

  const toolCalls = firstChoice.message.tool_calls;
  if (Array.isArray(toolCalls)) {
    for (const toolCall of toolCalls) {
      if (!isRecord(toolCall) || !isRecord(toolCall.function)) {
        continue;
      }

      if (
        toolCall.function.name === "submit_launch_report" &&
        typeof toolCall.function.arguments === "string" &&
        toolCall.function.arguments.trim()
      ) {
        return toolCall.function.arguments;
      }
    }
  }

  const content = firstChoice.message.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("NVIDIA response assistant message was empty.");
  }

  return content;
}

function parseJsonCandidate(rawText: string) {
  const trimmed = rawText.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/iu, "")
    .replace(/\s*```$/u, "")
    .trim();
  const candidates = [trimmed, withoutFence];
  const objectStart = withoutFence.indexOf("{");
  const objectEnd = withoutFence.lastIndexOf("}");

  if (objectStart >= 0 && objectEnd > objectStart) {
    candidates.push(withoutFence.slice(objectStart, objectEnd + 1));
  }

  const errors: string[] = [];
  for (const candidate of Array.from(new Set(candidates))) {
    const validation = parseLaunchReportJson(candidate, { requireAnalysis: true });
    if (validation.ok) {
      return validation.report;
    }
    errors.push(...validation.errors);
  }

  throw new Error(`NVIDIA JSON validation failed: ${Array.from(new Set(errors)).join("; ")}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
