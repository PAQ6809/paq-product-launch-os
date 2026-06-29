import { NextResponse } from "next/server";
import { upsertDraft } from "@/lib/db/drafts";
import { trackWorkspaceEvent } from "@/lib/db/workspace-events";
import { getCurrentUser } from "@/lib/supabase/server";
import type { NewProductDraft } from "@/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      {
        error: "AUTH_REQUIRED",
        message: "Sign in before importing an anonymous draft."
      },
      { status: 401, headers: noStoreHeaders() }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON", message: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = readAnonymousDraft(payload);
  if (!parsed) {
    return NextResponse.json({ error: "INVALID_ANONYMOUS_DRAFT", message: "Missing draftKey or formData." }, { status: 400 });
  }

  try {
    const draft = await upsertDraft(user.id, parsed);
    await trackWorkspaceEvent(user.id, null, "anonymous_draft.imported", { draftKey: parsed.draftKey });
    return NextResponse.json({ draft, source: "supabase" }, { status: 201, headers: noStoreHeaders() });
  } catch (error) {
    return NextResponse.json(
      {
        error: "ANONYMOUS_DRAFT_IMPORT_FAILED",
        message: error instanceof Error ? error.message : "Anonymous draft import failed."
      },
      { status: 500, headers: noStoreHeaders() }
    );
  }
}

function readAnonymousDraft(payload: unknown) {
  if (!isRecord(payload)) return null;
  const source = isRecord(payload.draft) ? payload.draft : payload;
  const draftKey = typeof source.draftKey === "string" ? source.draftKey.trim() : "";
  const formData = isProductDraft(source.formData) ? source.formData : null;
  if (!draftKey || !formData) return null;
  return {
    draftKey,
    formData,
    currentStep: typeof source.currentStep === "string" ? source.currentStep : "product-input",
    completionPercent: typeof source.completionPercent === "number" ? source.completionPercent : undefined
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function noStoreHeaders() {
  return { "Cache-Control": "no-store" };
}
