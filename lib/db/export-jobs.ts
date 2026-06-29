import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ExportFormat = "markdown" | "json" | "html" | "csv" | "zip";
export type ExportJobStatus = "queued" | "processing" | "completed" | "failed" | "expired";

export type ExportJobInput = {
  reportType: string;
  format: ExportFormat;
  productIds: string[];
  fileName?: string;
  filePath?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
};

export async function createExportJob(userId: string, input: ExportJobInput) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("export_jobs")
    .insert({
      user_id: userId,
      report_type: input.reportType,
      status: "queued",
      format: input.format,
      product_ids: input.productIds,
      file_name: input.fileName,
      file_path: input.filePath,
      expires_at: input.expiresAt ?? defaultExpiry(),
      metadata: input.metadata ?? {}
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateExportJobStatus(
  userId: string,
  jobId: string,
  status: ExportJobStatus,
  patch?: { fileName?: string; filePath?: string; errorMessage?: string; metadata?: Record<string, unknown> }
) {
  const now = new Date().toISOString();
  const statusPatch = {
    status,
    file_name: patch?.fileName,
    file_path: patch?.filePath,
    error_message: patch?.errorMessage,
    metadata: patch?.metadata,
    completed_at: status === "completed" ? now : undefined,
    failed_at: status === "failed" ? now : undefined
  };
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("export_jobs")
    .update(statusPatch)
    .eq("user_id", userId)
    .eq("id", jobId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function listExportJobs(userId: string) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("export_jobs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getExportJob(userId: string, jobId: string) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("export_jobs")
    .select("*")
    .eq("user_id", userId)
    .eq("id", jobId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

function defaultExpiry() {
  const hours = Number(process.env.EXPORT_RETENTION_HOURS ?? 24);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (Number.isFinite(hours) ? hours : 24));
  return expiresAt.toISOString();
}

async function requireDb() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}
