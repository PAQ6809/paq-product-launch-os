import type { LocalProductDraft } from "@/lib/autosave/local-draft";

export type DraftSyncResult =
  | { ok: true; source: "supabase"; data: unknown }
  | { ok: false; status: number; message: string };

export async function syncDraftToCloud(draft: LocalProductDraft): Promise<DraftSyncResult> {
  return postDraft("/api/drafts", draft);
}

export async function importAnonymousDraft(draft: LocalProductDraft): Promise<DraftSyncResult> {
  return postDraft("/api/anonymous-draft/import", { draft });
}

export async function loadLatestCloudDraft(): Promise<LocalProductDraft | null> {
  try {
    const response = await fetch("/api/drafts", { cache: "no-store" });
    const data = await response.json().catch(() => null);

    if (!response.ok || !isRecord(data) || !isCloudDraft(data.draft)) {
      return null;
    }

    return {
      version: 1,
      draftKey: data.draft.draftKey,
      formData: data.draft.formData,
      currentStep: data.draft.currentStep ?? "product-input",
      completionPercent: data.draft.completionPercent ?? 0,
      autosavedAt: data.draft.autosavedAt,
      source: "cloud"
    };
  } catch {
    return null;
  }
}

async function postDraft(url: string, payload: unknown): Promise<DraftSyncResult> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: readMessage(data) ?? `Draft sync failed with ${response.status}.`
      };
    }

    return { ok: true, source: "supabase", data };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message: error instanceof Error ? error.message : "Draft sync failed."
    };
  }
}

function readMessage(data: unknown) {
  if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") {
    return data.message;
  }

  return null;
}

function isCloudDraft(value: unknown): value is {
  draftKey: string;
  formData: LocalProductDraft["formData"];
  currentStep?: string | null;
  completionPercent?: number | null;
  autosavedAt: string;
} {
  if (!isRecord(value) || !isProductDraft(value.formData)) {
    return false;
  }

  return typeof value.draftKey === "string" && typeof value.autosavedAt === "string";
}

function isProductDraft(value: unknown): value is LocalProductDraft["formData"] {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.category === "string" &&
    typeof value.features === "string" &&
    typeof value.cost === "string" &&
    typeof value.expectedPrice === "string" &&
    typeof value.targetAudience === "string" &&
    typeof value.brandStyle === "string" &&
    typeof value.salesChannels === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
