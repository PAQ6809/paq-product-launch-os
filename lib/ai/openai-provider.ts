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

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4.1-mini";

type OpenAIProviderConfig = {
  apiKey: string;
  model?: string;
  temperature?: number;
  requestTimeoutMs?: number;
};

type OpenAIResponsePayload = {
  output_text?: unknown;
  output?: unknown;
};

export class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const;
  readonly model: string;
  private readonly apiKey: string;
  private readonly temperature: number;
  private readonly requestTimeoutMs: number;

  constructor(config: OpenAIProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_MODEL;
    this.temperature = config.temperature ?? 0.1;
    this.requestTimeoutMs = config.requestTimeoutMs ?? 45_000;
  }

  async generateLaunchReport(
    input: GenerateLaunchReportInput,
    options: GenerateLaunchReportOptions = {}
  ): Promise<LaunchReport> {
    const controller = new AbortController();
    const timeout = windowlessSetTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await fetch(OPENAI_RESPONSES_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: options.model ?? this.model,
          temperature: this.temperature,
          input: [
            {
              role: "system",
              content: PRODUCT_LAUNCH_SYSTEM_PROMPT
            },
            {
              role: "user",
              content: buildProductLaunchUserPrompt(input)
            }
          ],
          text: {
            format: {
              type: "json_schema",
              name: "paq_launch_report",
              schema: LAUNCH_REPORT_JSON_SCHEMA,
              strict: true
            }
          }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errorText.slice(0, 500)}`);
      }

      const payload = (await response.json()) as OpenAIResponsePayload;
      const rawText = extractOutputText(payload);
      const validation = parseLaunchReportJson(rawText);

      if (!validation.ok) {
        throw new Error(`OpenAI JSON validation failed: ${validation.errors.join("; ")}`);
      }

      const report = normalizeGeneratedLaunchReport(validation.report, input, { isMock: false });
      assertNoForbiddenMarketingClaims(report);
      return report;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function extractOutputText(payload: OpenAIResponsePayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  if (Array.isArray(payload.output)) {
    for (const outputItem of payload.output) {
      if (!isRecord(outputItem) || !Array.isArray(outputItem.content)) {
        continue;
      }

      for (const contentItem of outputItem.content) {
        if (isRecord(contentItem) && typeof contentItem.text === "string" && contentItem.text.trim()) {
          return contentItem.text;
        }
      }
    }
  }

  throw new Error("OpenAI response did not include output_text.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function windowlessSetTimeout(callback: () => void, delay: number) {
  return globalThis.setTimeout(callback, delay);
}
