import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { assertSupabaseServer } from '@/lib/env';

let cached: SupabaseClient | null = null;

/**
 * Service-role Supabase client. SERVER ONLY. Bypasses RLS, so every route that
 * uses it MUST validate the caller's token before reading/writing card data.
 */
export function getServiceClient(): SupabaseClient {
  if (cached) return cached;
  const env = assertSupabaseServer();
  cached = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
