import {
  buildTranslationSourceSections,
  translationSectionKeys
} from "@/lib/translation/translation-sections";
import type { LaunchReport } from "@/types/report";

export const TRANSLATION_RESULT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["sourceLanguage", "targetLanguage", "translatedAt", "provider", "warning", "sections"],
  properties: {
    sourceLanguage: { type: "string", enum: ["zh-TW"] },
    targetLanguage: { type: "string", enum: ["en"] },
    translatedAt: { type: "string" },
    provider: { type: "string", enum: ["openai"] },
    warning: { type: "string" },
    sections: {
      type: "object",
      additionalProperties: false,
      required: translationSectionKeys,
      properties: Object.fromEntries(translationSectionKeys.map((key) => [key, { type: "string" }]))
    }
  }
} as const;

export function buildPreciseTranslationUserPrompt(report: LaunchReport) {
  const sourceSections = buildTranslationSourceSections(report);

  return `
Translate this Traditional Chinese product launch report into professional English.

Keep every section key unchanged. Translate section by section. Do not summarize, omit, or add unsupported claims.

Report metadata:
${JSON.stringify(
  {
    productName: report.productName,
    category: report.category,
    generatedAt: report.generatedAt,
    suggestedPrice: report.pricingStrategy.suggestedPrice,
    sourceLanguage: "zh-TW",
    targetLanguage: "en"
  },
  null,
  2
)}

Source sections:
${JSON.stringify(sourceSections, null, 2)}

Return a JSON object that matches this structure:
{
  "sourceLanguage": "zh-TW",
  "targetLanguage": "en",
  "translatedAt": "ISO-8601 string",
  "provider": "openai",
  "warning": "",
  "sections": {
    ${translationSectionKeys.map((key) => `"${key}": "English translation string"`).join(",\n    ")}
  }
}
`.trim();
}
