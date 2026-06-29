import "server-only";

import { decryptJson, encryptJson } from "@/lib/security/encryption";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function saveEncryptedProductData(userId: string, productId: string, confidentialData: unknown) {
  const supabase = await requireDb();
  const encrypted = encryptJson(confidentialData);
  const { data, error } = await supabase
    .from("products")
    .update({ encrypted_confidential_data: encrypted, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", productId)
    .select("id, encrypted_confidential_data")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getDecryptedProductData<T = unknown>(userId: string, productId: string) {
  const supabase = await requireDb();
  const { data, error } = await supabase
    .from("products")
    .select("encrypted_confidential_data")
    .eq("user_id", userId)
    .eq("id", productId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.encrypted_confidential_data) return null;
  return decryptJson<T>(data.encrypted_confidential_data);
}

async function requireDb() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}
