import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function trackWorkspaceEvent(userId: string, productId: string | null, eventType: string, metadata?: Record<string, unknown>) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("workspace_events")
    .insert({ user_id: userId, product_id: productId, event_type: eventType, metadata: metadata ?? {} })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}
