export function buildSiteTranslationUserPrompt(entries: Array<{ key: string; value: string }>, targetLocale: string) {
  return JSON.stringify({ task: "Translate values only and preserve keys.", targetLocale, entries });
}
