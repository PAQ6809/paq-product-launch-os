import "server-only";

import { decryptJson, encryptJson } from "@/lib/security/encryption";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ReportCollectionInput = {
  title: string;
  description?: string;
  productIds: string[];
  templateId?: string;
  collectionReport?: unknown;
};

export async function createReportCollection(userId: string, input: ReportCollectionInput) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("report_collections")
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description,
      product_ids: input.productIds,
      template_id: input.templateId ?? "portfolio-overview",
      encrypted_collection_report: input.collectionReport ? encryptJson(input.collectionReport) : null
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getReportCollection<T = unknown>(userId: string, collectionId: string) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("report_collections")
    .select("*")
    .eq("user_id", userId)
    .eq("id", collectionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    ...data,
    collectionReport: data.encrypted_collection_report
      ? decryptJson<T>(data.encrypted_collection_report)
      : null
  };
}

export async function listReportCollections(userId: string) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("report_collections")
    .select("id, title, description, product_ids, template_id, created_at, updated_at, archived_at")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function archiveReportCollection(userId: string, collectionId: string) {
  const supabase = await requireDb();
  const { error } = await supabase
    .from("report_collections")
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", collectionId);

  if (error) throw new Error(error.message);
}

async function requireDb() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}
