import { translationSectionKeys } from "@/lib/translation/translation-sections";

const stringField = { type: "string", minLength: 1 } as const;
const sectionProperties = Object.fromEntries(translationSectionKeys.map((key) => [key, stringField]));

export const REPORT_TRANSLATION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["sourceLocale", "targetLocale", "provider", "model", "translatedAt", "isFallback", "sections"],
  properties: {
    sourceLocale: { type: "string", enum: ["zh-TW", "en", "ja", "ko", "ar"] },
    targetLocale: { type: "string", enum: ["zh-TW", "en", "ja", "ko", "ar"] },
    provider: { type: "string", enum: ["mock", "openai", "nvidia"] },
    model: stringField,
    translatedAt: stringField,
    isFallback: { type: "boolean" },
    warning: { type: ["string", "null"] },
    sections: {
      type: "object",
      additionalProperties: false,
      required: translationSectionKeys,
      properties: sectionProperties
    }
  }
} as const;
