import type { TranslationResult } from "@/types/report";

const TRANSLATION_STORAGE_KEY = "paq-product-launch-os:v0.3.1:translations";
const STORAGE_VERSION = 31;

export type StoredTranslation = {
  productId: string;
  translation: TranslationResult;
  savedAt: string;
};

type StoredTranslationState = {
  version: number;
  translations: StoredTranslation[];
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isStoredTranslation(value: unknown): value is StoredTranslation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<StoredTranslation>;
  return Boolean(item.productId && item.translation && item.savedAt);
}

function readTranslations() {
  if (!canUseLocalStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(TRANSLATION_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredTranslationState>;
    return Array.isArray(parsed.translations) ? parsed.translations.filter(isStoredTranslation) : [];
  } catch {
    return [];
  }
}

function saveTranslations(translations: StoredTranslation[]) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(
    TRANSLATION_STORAGE_KEY,
    JSON.stringify({
      version: STORAGE_VERSION,
      translations
    })
  );
}

export function upsertStoredTranslation(translation: StoredTranslation) {
  const current = readTranslations();
  const next = current.some((item) => item.productId === translation.productId)
    ? current.map((item) => (item.productId === translation.productId ? translation : item))
    : [translation, ...current];

  saveTranslations(next);
  return next;
}

export function findStoredTranslation(productId: string) {
  return readTranslations().find((item) => item.productId === productId) ?? null;
}
