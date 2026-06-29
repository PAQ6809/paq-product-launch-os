import { defineRouting } from "next-intl/routing";

export const supportedLocales = ["zh-TW", "en", "ja", "ko", "ar"] as const;
export const defaultLocale = "zh-TW" as const;
export type AppLocale = (typeof supportedLocales)[number];

export const localeCatalog = {
  "zh-TW": { name: "繁體中文", direction: "ltr", font: "Inter, Noto Sans TC, sans-serif", active: true },
  en: { name: "English", direction: "ltr", font: "Inter, sans-serif", active: true },
  ja: { name: "日本語", direction: "ltr", font: "Inter, Noto Sans JP, sans-serif", active: true },
  ko: { name: "한국어", direction: "ltr", font: "Inter, Noto Sans KR, sans-serif", active: true },
  es: { name: "Español", direction: "ltr", font: "Inter, sans-serif", active: false },
  fr: { name: "Français", direction: "ltr", font: "Inter, sans-serif", active: false },
  de: { name: "Deutsch", direction: "ltr", font: "Inter, sans-serif", active: false },
  vi: { name: "Tiếng Việt", direction: "ltr", font: "Inter, sans-serif", active: false },
  th: { name: "ไทย", direction: "ltr", font: "Inter, Noto Sans Thai, sans-serif", active: false },
  id: { name: "Bahasa Indonesia", direction: "ltr", font: "Inter, sans-serif", active: false },
  ar: { name: "العربية", direction: "rtl", font: "Inter, Noto Sans Arabic, sans-serif", active: true },
  he: { name: "עברית", direction: "rtl", font: "Inter, Noto Sans Hebrew, sans-serif", active: false }
} as const;

export const rtlLocales = ["ar", "he"] as const;

export function isSupportedLocale(locale: string): locale is AppLocale {
  return supportedLocales.includes(locale as AppLocale);
}

export function isRtlLocale(locale: string) {
  return (rtlLocales as readonly string[]).includes(locale);
}

export const routing = defineRouting({
  locales: supportedLocales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true
});
