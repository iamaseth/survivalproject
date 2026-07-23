// Server-only. Save / load / delete per-user connector keys via service_role.
import { encryptConnectionKey, decryptConnectionKey } from "./connectionKeyCrypto.server";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function saveConnectionKeyForUser(userId: string, connectorId: string, connectionAPIKey: string) {
  const sb = await admin();
  const { error } = await sb.from("app_user_connections").upsert(
    {
      user_id: userId,
      connector_id: connectorId,
      connection_key_ciphertext: encryptConnectionKey(connectionAPIKey),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,connector_id" },
  );
  if (error) throw error;
}

export async function getConnectionKeyForUser(userId: string, connectorId: string): Promise<string | null> {
  const sb = await admin();
  const { data, error } = await sb
    .from("app_user_connections")
    .select("connection_key_ciphertext")
    .eq("user_id", userId)
    .eq("connector_id", connectorId)
    .maybeSingle();
  if (error) throw error;
  return data ? decryptConnectionKey(data.connection_key_ciphertext) : null;
}

export async function deleteConnectionKeyForUser(userId: string, connectorId: string) {
  const sb = await admin();
  await sb.from("app_user_connections").delete().eq("user_id", userId).eq("connector_id", connectorId);
}
