import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { publicEnv } from '@/lib/env';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Cookie-based Supabase client for the AUTHENTICATED creator session (Server
 * Components, Route Handlers, middleware). Uses the anon/publishable key; the
 * user's session lives in cookies. Use this to identify who is signed in
 * (getUser) — never to bypass RLS (that's the service client).
 */
export function getSSRServerClient() {
  const cookieStore = cookies();
  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component (read-only cookies). Safe to ignore —
          // middleware refreshes the session cookie on navigation.
        }
      },
    },
  });
}

/** Returns the signed-in user or null. */
export async function getSessionUser() {
  const supabase = getSSRServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
