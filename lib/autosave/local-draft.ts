import type { NewProductDraft } from "@/types";

const STORAGE_KEY = "paq-product-launch-os:v0.4:anonymous-product-draft";
const STORAGE_VERSION = 1;

export type LocalProductDraft = {
  version: number;
  draftKey: string;
  formData: NewProductDraft;
  currentStep: string;
  completionPercent: number;
  autosavedAt: string;
  source?: "local" | "cloud";
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function createDraftKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `draft-${crypto.randomUUID()}`;
  }

  return `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function calculateDraftCompletion(formData: NewProductDraft) {
  const fields: Array<keyof NewProductDraft> = [
    "name",
    "category",
    "features",
    "cost",
    "expectedPrice",
    "targetAudience",
    "brandStyle",
    "salesChannels"
  ];
  const completed = fields.filter((field) => String(formData[field] ?? "").trim().length > 0).length;
  return Math.round((completed / fields.length) * 100);
}

export function hasMeaningfulDraft(formData: NewProductDraft) {
  return ["name", "features", "cost", "expectedPrice", "targetAudience"].some((field) => {
    const key = field as keyof NewProductDraft;
    return String(formData[key] ?? "").trim().length > 0;
  });
}

export function loadLocalProductDraft() {
  if (!canUseLocalStorage()) return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<LocalProductDraft>;
    if (!parsed.formData || !parsed.draftKey) return null;
    return {
      version: parsed.version ?? STORAGE_VERSION,
      draftKey: parsed.draftKey,
      formData: parsed.formData,
      currentStep: parsed.currentStep ?? "product-input",
      completionPercent: parsed.completionPercent ?? calculateDraftCompletion(parsed.formData),
      autosavedAt: parsed.autosavedAt ?? new Date().toISOString(),
      source: parsed.source === "cloud" ? "cloud" : "local"
    } satisfies LocalProductDraft;
  } catch {
    return null;
  }
}

export function saveLocalProductDraft(formData: NewProductDraft, draftKey = createDraftKey(), currentStep = "product-input") {
  const draft: LocalProductDraft = {
    version: STORAGE_VERSION,
    draftKey,
    formData,
    currentStep,
    completionPercent: calculateDraftCompletion(formData),
    autosavedAt: new Date().toISOString(),
    source: "local"
  };

  if (canUseLocalStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }

  return draft;
}

export function storeLocalProductDraft(draft: LocalProductDraft) {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...draft,
      version: STORAGE_VERSION,
      source: draft.source ?? "local"
    })
  );
}

export function clearLocalProductDraft() {
  if (!canUseLocalStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}
