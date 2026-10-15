import "server-only";

import { readSupabaseServerConfig } from "@/lib/supabase/config";
import { PersistenceConfigError } from "@/lib/supabase/errors";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseAdmin(): SupabaseClient | null {
  const config = readSupabaseServerConfig();
  if (!config) return null;
  return createClient(config.url, config.secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function requireSupabaseAdmin(): SupabaseClient {
  const client = createSupabaseAdmin();
  if (!client) throw new PersistenceConfigError();
  return client;
}
