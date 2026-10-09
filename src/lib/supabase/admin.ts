import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Server-only client using the Supabase SERVICE ROLE key. This bypasses
// row-level security entirely, so it must only ever be imported from
// server code (server actions / server components) that has already
// checked the admin password — never from a "use client" component, and
// never used to serve a request before that check runs.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_URL) is not set — add it to .env.local / Vercel."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
