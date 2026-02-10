import { createClient } from "@supabase/supabase-js";

/**
 * Admin client — uses SERVICE_ROLE key.
 * NEVER import this in client components or expose in browser bundles.
 * Only use inside API routes / server actions.
 */
export function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
