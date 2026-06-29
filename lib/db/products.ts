import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LifecycleStatus, NewProductDraft, Product } from "@/types";

type ProductRow = {
  id: string;
  title: string;
  category: string | null;
  features: string | null;
  cost: number | string | null;
  target_price: number | string | null;
  target_audience: string | null;
  brand_style: string | null;
  sales_channels: unknown;
  lifecycle_status: LifecycleStatus | string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type ProductPatch = Partial<Omit<Product, "id" | "createdAt" | "latestReportTitle" | "pendingReviewCount">>;

export async function listProducts(userId: string) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ProductRow[]).map(productFromRow);
}

export async function getProduct(userId: string, productId: string) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .eq("id", productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? productFromRow(data as ProductRow) : null;
}

export async function createProduct(userId: string, input: NewProductDraft) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("products")
    .insert({ user_id: userId, ...rowFromDraft(input) })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return productFromRow(data as ProductRow);
}

export async function updateProduct(userId: string, productId: string, patch: ProductPatch) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("products")
    .update({ ...rowFromPatch(patch), updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", productId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return productFromRow(data as ProductRow);
}

export async function archiveProduct(userId: string, productId: string) {
  const supabase = await requireDb();
  const { error } = await supabase
    .from("products")
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", productId);
  if (error) throw new Error(error.message);
}

function productFromRow(row: ProductRow): Product {
  const salesChannels = Array.isArray(row.sales_channels) ? row.sales_channels.filter((item): item is string => typeof item === "string") : [];
  const name = row.title;
  return {
    id: row.id,
    name,
    category: row.category ?? "其他商品",
    features: row.features ?? "",
    cost: Number(row.cost ?? 0),
    expectedPrice: Number(row.target_price ?? 0),
    targetAudience: row.target_audience ?? "",
    brandStyle: row.brand_style ?? "",
    salesPlatforms: salesChannels,
    lifecycleStatus: normalizeLifecycle(row.lifecycle_status),
    imageUrl: "/hero-workspace.png",
    createdAt: row.created_at,
    latestReportTitle: `${name} 商品上市企劃書`,
    pendingReviewCount: 0
  };
}

function rowFromDraft(input: NewProductDraft) {
  return {
    title: input.name.trim() || "未命名商品",
    category: input.category,
    features: input.features,
    cost: Number(input.cost || 0),
    target_price: Number(input.expectedPrice || 0),
    target_audience: input.targetAudience,
    brand_style: input.brandStyle,
    sales_channels: input.salesChannels.split(/[,，、\n]/).map((item) => item.trim()).filter(Boolean),
    lifecycle_status: "positioning"
  };
}

function rowFromPatch(patch: ProductPatch) {
  return {
    title: patch.name,
    category: patch.category,
    features: patch.features,
    cost: patch.cost,
    target_price: patch.expectedPrice,
    target_audience: patch.targetAudience,
    brand_style: patch.brandStyle,
    sales_channels: patch.salesPlatforms,
    lifecycle_status: patch.lifecycleStatus
  };
}

function normalizeLifecycle(value: string | null): LifecycleStatus {
  const allowed: LifecycleStatus[] = ["idea", "research", "positioning", "packaging", "listing", "marketing", "launched", "optimizing", "archived"];
  return allowed.includes(value as LifecycleStatus) ? (value as LifecycleStatus) : "idea";
}

async function requireDb() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}
