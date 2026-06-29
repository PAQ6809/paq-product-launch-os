import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DataRequestType = "export_data" | "delete_account";

export async function createDataRequest(userId: string, requestType: DataRequestType) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("data_requests")
    .insert({
      user_id: userId,
      request_type: requestType,
      status: "requested",
      metadata: {}
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function listDataRequests(userId: string) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("data_requests")
    .select("*")
    .eq("user_id", userId)
    .order("requested_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

async function requireDb() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}
