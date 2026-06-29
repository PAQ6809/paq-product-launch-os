export const SITE_TRANSLATION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["targetLocale", "entries"],
  properties: {
    targetLocale: { type: "string" },
    entries: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "value"],
        properties: { key: { type: "string" }, value: { type: "string" } }
      }
    }
  }
} as const;
