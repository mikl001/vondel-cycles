import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

/**
 * Cookie-less anon client for static rendering (SSG/ISR) of public catalog
 * data. Using the cookie-bound server client would opt pages into dynamic
 * rendering; this one keeps them statically renderable. RLS still applies.
 */
export function createStaticClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
