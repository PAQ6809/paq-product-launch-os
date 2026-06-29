import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NewProductDraft } from "@/types";

export type ProductDraftRecord = {
  id: string;
  productId?: string | null;
  draftKey: string;
  formData: NewProductDraft;
  currentStep?: string | null;
  completionPercent?: number | null;
  autosavedAt: string;
};

export async function getLatestDraft(userId: string) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("product_drafts")
    .select("*")
    .eq("user_id", userId)
    .order("autosaved_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? draftFromRow(data as DraftRow) : null;
}

export async function getDraft(userId: string, draftId: string) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("product_drafts")
    .select("*")
    .eq("user_id", userId)
    .eq("id", draftId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? draftFromRow(data as DraftRow) : null;
}

export async function upsertDraft(userId: string, data: { draftKey: string; formData: NewProductDraft; productId?: string | null; currentStep?: string; completionPercent?: number }) {
  const supabase = await requireDb();
  const existing = await supabase
    .from("product_drafts")
    .select("id")
    .eq("user_id", userId)
    .eq("draft_key", data.draftKey)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);

  const payload = {
    user_id: userId,
    product_id: data.productId ?? null,
    draft_key: data.draftKey,
    form_data: data.formData,
    current_step: data.currentStep ?? "product-input",
    completion_percent: data.completionPercent ?? completionPercent(data.formData),
    autosaved_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const query = existing.data
    ? supabase.from("product_drafts").update(payload).eq("id", existing.data.id).select("*").single()
    : supabase.from("product_drafts").insert(payload).select("*").single();
  const { data: row, error } = await query;
  if (error) throw new Error(error.message);
  return draftFromRow(row as DraftRow);
}

export async function deleteDraft(userId: string, draftIdOrKey: string) {
  const supabase = await requireDb();
  const { error } = await supabase
    .from("product_drafts")
    .delete()
    .eq("user_id", userId)
    .or(`id.eq.${draftIdOrKey},draft_key.eq.${draftIdOrKey}`);
  if (error) throw new Error(error.message);
}

function completionPercent(formData: NewProductDraft) {
  const keys: Array<keyof NewProductDraft> = ["name", "category", "features", "cost", "expectedPrice", "targetAudience", "brandStyle", "salesChannels"];
  const done = keys.filter((key) => String(formData[key] ?? "").trim().length > 0).length;
  return Math.round((done / keys.length) * 100);
}

type DraftRow = {
  id: string;
  product_id: string | null;
  draft_key: string;
  form_data: NewProductDraft;
  current_step: string | null;
  completion_percent: number | null;
  autosaved_at: string;
};

function draftFromRow(row: DraftRow): ProductDraftRecord {
  return {
    id: row.id,
    productId: row.product_id,
    draftKey: row.draft_key,
    formData: row.form_data,
    currentStep: row.current_step,
    completionPercent: row.completion_percent,
    autosavedAt: row.autosaved_at
  };
}

async function requireDb() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}
