import "server-only";

import { createHash, createHmac } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function trackSecurityEvent(
  userId: string | null,
  eventType: string,
  metadata?: Record<string, unknown>
) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_security_events")
    .insert({
      user_id: userId,
      event_type: eventType,
      metadata: metadata ?? {}
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function trackExportEvent(userId: string, exportJobId: string, metadata?: Record<string, unknown>) {
  return trackSecurityEvent(userId, "report.export", { exportJobId, ...(metadata ?? {}) });
}

export function hashIp(ip: string) {
  return hashForAudit(ip);
}

export function hashUserAgent(userAgent: string) {
  return hashForAudit(userAgent);
}

function hashForAudit(value: string) {
  const salt = process.env.SECURITY_EVENT_HASH_SALT || process.env.ENCRYPTION_MASTER_KEY;
  if (salt) {
    return createHmac("sha256", salt).update(value).digest("hex");
  }

  return createHash("sha256").update(`paq-dev-audit:${value}`).digest("hex");
}
