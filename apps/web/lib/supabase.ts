import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazily create the client so that importing this module at build time
// (when env vars may not be present) does not throw "supabaseUrl is required".
function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return createClient(url, key);
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    return getClient()[prop as keyof SupabaseClient];
  },
});
