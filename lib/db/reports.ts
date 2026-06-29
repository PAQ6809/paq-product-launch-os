import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AIProviderName } from "@/lib/ai/provider";
import type { LaunchReport } from "@/types/report";

export type ReportMetadata = {
  provider: AIProviderName;
  model?: string;
  isFallback?: boolean;
  validationPassed?: boolean;
  generatedAt?: string;
};

export async function saveLaunchReport(userId: string, productId: string, report: LaunchReport, metadata: ReportMetadata) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("launch_reports")
    .insert({
      user_id: userId,
      product_id: productId,
      report,
      provider: metadata.provider,
      model: metadata.model,
      is_fallback: metadata.isFallback ?? false,
      validation_passed: metadata.validationPassed ?? true,
      generated_at: metadata.generatedAt ?? new Date().toISOString()
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as { id: string; product_id: string; report: LaunchReport; created_at: string };
}

export async function getLatestLaunchReport(userId: string, productId: string) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("launch_reports")
    .select("*")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listReports(userId: string, productId: string) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("launch_reports")
    .select("*")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function requireDb() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}
