import "server-only";

import { PRODUCT_LAUNCH_SYSTEM_PROMPT } from "@/lib/ai/prompts/product-launch-system-prompt";
import {
  buildProductLaunchUserPrompt,
  LAUNCH_REPORT_JSON_SCHEMA
} from "@/lib/ai/prompts/product-launch-user-prompt";
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
const REGULATED_CATEGORY_PATTERN = /食品|食物|飲品|保健|營養|醫療|藥|美妝|保養|香氛|精油|身體|肌膚/i;

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
  private readonly apiKey: string;
  private readonly model: string;
  private readonly temperature: number;
  private readonly requestTimeoutMs: number;

  constructor(config: OpenAIProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_MODEL;
    this.temperature = config.temperature ?? 0.2;
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

      const report = normalizeOpenAIReport(validation.report, input);
      assertNoForbiddenMarketingClaims(report);
      return withRegulatoryReminder(report, input);
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

function normalizeOpenAIReport(report: LaunchReport, input: GenerateLaunchReportInput): LaunchReport {
  return {
    ...report,
    productName: input.productName,
    category: input.category,
    generatedAt: new Date().toISOString(),
    isMock: false,
    pricingStrategy: {
      ...report.pricingStrategy,
      suggestedPrice: Number(report.pricingStrategy.suggestedPrice) || input.targetPrice
    }
  };
}

function withRegulatoryReminder(report: LaunchReport, input: GenerateLaunchReportInput): LaunchReport {
  const regulatedSource = `${input.category} ${input.features} ${input.productName}`;

  if (!REGULATED_CATEGORY_PATTERN.test(regulatedSource)) {
    return report;
  }

  const reminder =
    "此商品類別可能涉及食品、美妝、保健、醫療、香氛或身體接觸相關風險，正式對外使用前需由真人依平台規則與當地法規審核，且不得做出療效、疾病改善或效果保證類宣稱。";

  return {
    ...report,
    packagingBrief: {
      ...report.packagingBrief,
      complianceNotes: Array.from(new Set([...report.packagingBrief.complianceNotes, reminder]))
    },
    optimizationSuggestions: [
      ...report.optimizationSuggestions,
      {
        signal: "商品類別涉及法規或宣稱風險",
        action: "上架前安排人工審核所有包裝文案、商品頁、社群素材與客服話術。",
        why: "降低療效宣稱、商標授權、平台禁用語與消費者誤解風險。"
      }
    ]
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function windowlessSetTimeout(callback: () => void, delay: number) {
  return globalThis.setTimeout(callback, delay);
}
