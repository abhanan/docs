'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSSRBrowserClient } from '@/lib/supabase/ssr-browser';

/**
 * Small top-right account control shown on signed-in-relevant pages.
 * - Signed in: email + "My cards" + "Sign out"
 * - Signed out: a "Sign in" link (unless showSignInWhenLoggedOut is false)
 */
export function AccountMenu({
  showSignInWhenLoggedOut = true,
  showMyCards = true,
}: {
  showSignInWhenLoggedOut?: boolean;
  showMyCards?: boolean;
}) {
  const [email, setEmail] = useState<string | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    const supabase = getSSRBrowserClient();
    if (!supabase) {
      setEmail(null);
      return;
    }
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  if (email === undefined) return null; // avoid flicker while loading

  if (!email) {
    if (!showSignInWhenLoggedOut) return null;
    return (
      <div className="flex justify-end">
        <Link
          href="/login"
          className="rounded-full border border-stone-300 bg-white/80 px-4 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
      <span className="hidden text-stone-500 sm:inline">{email}</span>
      {showMyCards && (
        <Link
          href="/dashboard"
          className="rounded-full border border-stone-300 bg-white/80 px-3 py-1.5 font-medium text-stone-700 transition hover:bg-white"
        >
          My cards
        </Link>
      )}
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="rounded-full border border-stone-300 bg-white/80 px-3 py-1.5 font-medium text-stone-700 transition hover:bg-white"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
