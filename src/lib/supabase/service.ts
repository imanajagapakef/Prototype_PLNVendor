import { createClient } from "@supabase/supabase-js";

// Server-only. Never import from a client component: the secret key
// must not enter the browser bundle.
export function supabaseService() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY missing");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
