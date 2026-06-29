import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TranslationResult } from "@/types/report";

export async function saveReportTranslation(userId: string, productId: string, reportId: string | null, translation: TranslationResult, metadata: { validationPassed?: boolean }) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("report_translations")
    .insert({
      user_id: userId,
      product_id: productId,
      report_id: reportId,
      source_locale: translation.sourceLocale,
      target_locale: translation.targetLocale,
      translation,
      provider: translation.provider,
      model: translation.model,
      is_fallback: translation.isFallback,
      validation_passed: metadata.validationPassed ?? true,
      translated_at: translation.translatedAt
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getReportTranslation(userId: string, productId: string, reportId: string | null, targetLocale: string) {
  const supabase = await requireDb();
  let query = supabase
    .from("report_translations")
    .select("*")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .eq("target_locale", targetLocale)
    .order("created_at", { ascending: false })
    .limit(1);
  if (reportId) query = query.eq("report_id", reportId);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function requireDb() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}
