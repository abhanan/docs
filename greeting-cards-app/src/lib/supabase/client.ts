'use client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { publicEnv } from '@/lib/env';

let cached: SupabaseClient | null = null;

/**
 * Browser Supabase client using the anon key. Used ONLY to subscribe to the
 * Realtime wall (contributors table). RLS restricts it to SELECT on
 * contributors; all writes go through server API routes.
 *
 * Returns null if env is not configured yet (so the UI can degrade gracefully
 * before Supabase keys are provided).
 */
export function getBrowserClient(): SupabaseClient | null {
  if (cached) return cached;
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) return null;
  cached = createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 5 } },
  });
  return cached;
}
