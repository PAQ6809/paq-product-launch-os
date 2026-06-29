import "server-only";

import { REPORT_TRANSLATION_SYSTEM_PROMPT } from "@/lib/translation/prompts/report-translation-system-prompt";
import { buildReportTranslationUserPrompt } from "@/lib/translation/prompts/report-translation-user-prompt";
import { REPORT_TRANSLATION_JSON_SCHEMA } from "@/lib/translation/schemas/report-translation-json-schema";
import { parseReportTranslationJson } from "@/lib/translation/validators/report-translation-validator";
import type { TranslationOptions, TranslationProvider } from "@/lib/translation/provider";
import type { LaunchReport, TranslationProviderName, TranslationResult } from "@/types/report";

type Config = { name: Exclude<TranslationProviderName, "mock">; apiKey: string; model: string; requestTimeoutMs?: number };

export class AITranslationProvider implements TranslationProvider {
  readonly name: Config["name"];
  readonly model: string;
  private readonly apiKey: string;
  private readonly requestTimeoutMs: number;

  constructor(config: Config) {
    this.name = config.name;
    this.model = config.model;
    this.apiKey = config.apiKey;
    this.requestTimeoutMs = config.requestTimeoutMs ?? (config.name === "nvidia" ? 150_000 : 45_000);
  }

  async translateLaunchReport(report: LaunchReport, options: TranslationOptions): Promise<TranslationResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    try {
      const raw = this.name === "openai"
        ? await this.callOpenAI(report, options, controller.signal)
        : await this.callNvidia(report, options, controller.signal);
      const validation = parseReportTranslationJson(raw);
      if (!validation.ok) throw new Error(`Translation validation failed: ${validation.errors.join("; ")}`);
      return { ...validation.translation, sourceLocale: options.sourceLocale, targetLocale: options.targetLocale, provider: this.name, model: this.model, translatedAt: new Date().toISOString(), isFallback: false };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async callOpenAI(report: LaunchReport, options: TranslationOptions, signal: AbortSignal) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", signal,
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, temperature: 0.1, input: [{ role: "system", content: REPORT_TRANSLATION_SYSTEM_PROMPT }, { role: "user", content: buildReportTranslationUserPrompt(report, options.sourceLocale, options.targetLocale) }], text: { format: { type: "json_schema", name: "paq_report_translation", strict: true, schema: REPORT_TRANSLATION_JSON_SCHEMA } } })
    });
    if (!response.ok) throw new Error(`OpenAI translation error ${response.status}: ${(await response.text()).slice(0, 400)}`);
    const payload = await response.json() as { output_text?: string };
    if (!payload.output_text) throw new Error("OpenAI translation response was empty.");
    return payload.output_text;
  }

  private async callNvidia(report: LaunchReport, options: TranslationOptions, signal: AbortSignal) {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST", signal,
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, temperature: 0.1, top_p: 0.7, max_tokens: 4096, messages: [{ role: "system", content: `${REPORT_TRANSLATION_SYSTEM_PROMPT}\nCall submit_report_translation once.` }, { role: "user", content: buildReportTranslationUserPrompt(report, options.sourceLocale, options.targetLocale) }], tools: [{ type: "function", function: { name: "submit_report_translation", description: "Submit the localized report.", parameters: REPORT_TRANSLATION_JSON_SCHEMA } }], tool_choice: "auto", stream: false })
    });
    if (!response.ok) throw new Error(`NVIDIA translation error ${response.status}: ${(await response.text()).slice(0, 400)}`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string; tool_calls?: Array<{ function?: { name?: string; arguments?: string } }> } }> };
    const message = payload.choices?.[0]?.message;
    const args = message?.tool_calls?.find((call) => call.function?.name === "submit_report_translation")?.function?.arguments;
    if (args) return args;
    if (message?.content) return message.content.replace(/^```(?:json)?\s*/u, "").replace(/\s*```$/u, "");
    throw new Error("NVIDIA translation response was empty.");
  }
}
