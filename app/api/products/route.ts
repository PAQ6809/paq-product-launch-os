import { NextResponse } from "next/server";
import { createProduct, listProducts } from "@/lib/db/products";
import { trackWorkspaceEvent } from "@/lib/db/workspace-events";
import { getCurrentUser } from "@/lib/supabase/server";
import type { NewProductDraft } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return authRequired();

  try {
    const products = await listProducts(user.id);
    return NextResponse.json({ products, source: "supabase" }, { headers: noStoreHeaders() });
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

  const draft = readDraft(payload);
  if (!draft) {
    return NextResponse.json({ error: "INVALID_PRODUCT_DRAFT", message: "Missing required product draft fields." }, { status: 400 });
  }

  try {
    const product = await createProduct(user.id, draft);
    await trackWorkspaceEvent(user.id, product.id, "product.created", { productName: product.name });
    return NextResponse.json({ product, source: "supabase" }, { status: 201, headers: noStoreHeaders() });
  } catch (error) {
    return dbError(error);
  }
}

function readDraft(payload: unknown): NewProductDraft | null {
  if (!isRecord(payload)) return null;
  const source = isRecord(payload.draft) ? payload.draft : payload;
  const draft = {
    name: readString(source, "name"),
    category: readString(source, "category"),
    features: readString(source, "features"),
    cost: readString(source, "cost"),
    expectedPrice: readString(source, "expectedPrice"),
    targetAudience: readString(source, "targetAudience"),
    brandStyle: readString(source, "brandStyle"),
    salesChannels: readString(source, "salesChannels")
  };

  if (!draft.name || !draft.category || !draft.features || !draft.cost || !draft.expectedPrice) return null;
  return draft;
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function authRequired() {
  return NextResponse.json(
    {
      error: "AUTH_REQUIRED",
      message: "Sign in to use cloud workspace persistence. Anonymous demo data remains local."
    },
    { status: 401, headers: noStoreHeaders() }
  );
}

function dbError(error: unknown) {
  return NextResponse.json(
    {
      error: "WORKSPACE_PERSISTENCE_FAILED",
      message: error instanceof Error ? error.message : "Workspace persistence failed."
    },
    { status: 500, headers: noStoreHeaders() }
  );
}

function noStoreHeaders() {
  return { "Cache-Control": "no-store" };
}
