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
