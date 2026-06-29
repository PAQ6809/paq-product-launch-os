import { NextResponse } from "next/server";
import { deleteDraft, getDraft, getLatestDraft, upsertDraft } from "@/lib/db/drafts";
import { trackWorkspaceEvent } from "@/lib/db/workspace-events";
import { getCurrentUser } from "@/lib/supabase/server";
import type { NewProductDraft } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return authRequired();

  const url = new URL(request.url);
  const draftId = url.searchParams.get("id");

  try {
    const draft = draftId ? await getDraft(user.id, draftId) : await getLatestDraft(user.id);
    return NextResponse.json({ draft, source: "supabase" }, { headers: noStoreHeaders() });
  } catch (error) {
    return dbError(error);
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return authRequired();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON", message: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = readDraftPayload(payload);
  if (!parsed) {
    return NextResponse.json({ error: "INVALID_DRAFT", message: "Missing draftKey or formData." }, { status: 400 });
  }

  try {
    const draft = await upsertDraft(user.id, parsed);
    await trackWorkspaceEvent(user.id, parsed.productId ?? null, "draft.autosaved", { draftKey: parsed.draftKey });
    return NextResponse.json({ draft, source: "supabase" }, { headers: noStoreHeaders() });
  } catch (error) {
    return dbError(error);
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return authRequired();

  const url = new URL(request.url);
  const draftId = url.searchParams.get("id") ?? url.searchParams.get("draftKey");

  if (!draftId) {
    return NextResponse.json({ error: "MISSING_DRAFT_ID" }, { status: 400 });
  }

  try {
    await deleteDraft(user.id, draftId);
    await trackWorkspaceEvent(user.id, null, "draft.deleted", { draftId });
    return NextResponse.json({ ok: true }, { headers: noStoreHeaders() });
  } catch (error) {
    return dbError(error);
  }
}

function readDraftPayload(payload: unknown) {
  if (!isRecord(payload)) return null;
  const draftKey = readString(payload, "draftKey");
  const formData = isProductDraft(payload.formData) ? payload.formData : null;
  if (!draftKey || !formData) return null;

  return {
    draftKey,
    formData,
    productId: readOptionalString(payload, "productId"),
    currentStep: readOptionalString(payload, "currentStep") ?? "product-input",
    completionPercent: typeof payload.completionPercent === "number" ? payload.completionPercent : undefined
  };
}

function isProductDraft(value: unknown): value is NewProductDraft {
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

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(record: Record<string, unknown>, key: string) {
  const value = readString(record, key);
  return value || undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function authRequired() {
  return NextResponse.json(
    {
      error: "AUTH_REQUIRED",
      message: "Sign in to use cloud draft sync. Anonymous drafts remain local."
    },
    { status: 401, headers: noStoreHeaders() }
  );
}

function dbError(error: unknown) {
  return NextResponse.json(
    {
      error: "DRAFT_PERSISTENCE_FAILED",
      message: error instanceof Error ? error.message : "Draft persistence failed."
    },
    { status: 500, headers: noStoreHeaders() }
  );
}

function noStoreHeaders() {
  return { "Cache-Control": "no-store" };
}
