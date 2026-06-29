import { NextResponse } from "next/server";
import { archiveProduct, getProduct, updateProduct, type ProductPatch } from "@/lib/db/products";
import { trackWorkspaceEvent } from "@/lib/db/workspace-events";
import { getCurrentUser } from "@/lib/supabase/server";
import type { LifecycleStatus } from "@/types";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return authRequired();

  const { id } = await context.params;

  try {
    const product = await getProduct(user.id, id);
    if (!product) {
      return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404, headers: noStoreHeaders() });
    }
    return NextResponse.json({ product, source: "supabase" }, { headers: noStoreHeaders() });
  } catch (error) {
    return dbError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return authRequired();

  const { id } = await context.params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON", message: "Request body must be valid JSON." }, { status: 400 });
  }

  const patch = readProductPatch(payload);
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "EMPTY_PATCH" }, { status: 400 });
  }

  try {
    const product = await updateProduct(user.id, id, patch);
    await trackWorkspaceEvent(user.id, product.id, "product.updated", { fields: Object.keys(patch) });
    return NextResponse.json({ product, source: "supabase" }, { headers: noStoreHeaders() });
  } catch (error) {
    return dbError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return authRequired();

  const { id } = await context.params;

  try {
    await archiveProduct(user.id, id);
    await trackWorkspaceEvent(user.id, id, "product.archived");
    return NextResponse.json({ ok: true }, { headers: noStoreHeaders() });
  } catch (error) {
    return dbError(error);
  }
}

function readProductPatch(payload: unknown): ProductPatch {
  if (!isRecord(payload)) return {};
  const source = isRecord(payload.product) ? payload.product : payload;
  const patch: ProductPatch = {};

  if (typeof source.name === "string") patch.name = source.name.trim();
  if (typeof source.category === "string") patch.category = source.category.trim();
  if (typeof source.features === "string") patch.features = source.features.trim();
  if (typeof source.cost === "number") patch.cost = source.cost;
  if (typeof source.expectedPrice === "number") patch.expectedPrice = source.expectedPrice;
  if (typeof source.targetAudience === "string") patch.targetAudience = source.targetAudience.trim();
  if (typeof source.brandStyle === "string") patch.brandStyle = source.brandStyle.trim();
  if (Array.isArray(source.salesPlatforms)) patch.salesPlatforms = source.salesPlatforms.filter((item): item is string => typeof item === "string");
  if (typeof source.lifecycleStatus === "string" && isLifecycleStatus(source.lifecycleStatus)) patch.lifecycleStatus = source.lifecycleStatus;

  return patch;
}

function isLifecycleStatus(value: string): value is LifecycleStatus {
  return ["idea", "research", "positioning", "packaging", "listing", "marketing", "launched", "optimizing", "archived"].includes(value);
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
