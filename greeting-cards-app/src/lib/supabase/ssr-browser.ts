'use client';
import { createBrowserClient } from '@supabase/ssr';
import { publicEnv } from '@/lib/env';

/**
 * Cookie-based Supabase client for the browser, used for the creator auth flow
 * (Google OAuth + magic link) and reading the current session on the client.
 * Returns null if Supabase env isn't configured yet.
 */
export function getSSRBrowserClient() {
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) return null;
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
}
