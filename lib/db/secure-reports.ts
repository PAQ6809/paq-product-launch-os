import "server-only";

import { decryptJson, encryptJson } from "@/lib/security/encryption";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AIProviderName } from "@/lib/ai/provider";
import type { LaunchReport } from "@/types/report";

export type SecureReportMetadata = {
  provider: AIProviderName;
  model?: string;
  isFallback?: boolean;
  validationPassed?: boolean;
  generatedAt?: string;
};

type LaunchReportRow = {
  id: string;
  product_id: string;
  report: LaunchReport | Record<string, unknown> | null;
  encrypted_report?: unknown;
  provider: AIProviderName | null;
  model: string | null;
  is_fallback: boolean | null;
  validation_passed: boolean | null;
  generated_at: string | null;
  created_at: string;
};

type DecryptedLaunchReportRow = Omit<LaunchReportRow, "report"> & {
  report: LaunchReport;
};

export async function saveEncryptedLaunchReport(
  userId: string,
  productId: string,
  report: LaunchReport,
  metadata: SecureReportMetadata
) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("launch_reports")
    .insert({
      user_id: userId,
      product_id: productId,
      report: { encrypted: true },
      encrypted_report: encryptJson(report),
      provider: metadata.provider,
      model: metadata.model,
      is_fallback: metadata.isFallback ?? false,
      validation_passed: metadata.validationPassed ?? true,
      generated_at: metadata.generatedAt ?? new Date().toISOString()
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as LaunchReportRow;
}

export async function getDecryptedLaunchReport(userId: string, productId: string, reportId: string) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("launch_reports")
    .select("*")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .eq("id", reportId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? decryptReportRow(data as LaunchReportRow) : null;
}

export async function getLatestDecryptedLaunchReport(userId: string, productId: string) {
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
  return data ? decryptReportRow(data as LaunchReportRow) : null;
}

function decryptReportRow(row: LaunchReportRow): DecryptedLaunchReportRow {
  const report = row.encrypted_report ? decryptJson<LaunchReport>(row.encrypted_report as never) : row.report;
  return { ...row, report: report as LaunchReport };
}

async function requireDb() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}
