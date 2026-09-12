'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSSRBrowserClient } from '@/lib/supabase/ssr-browser';

export default function HomePage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = getSSRBrowserClient();
    if (!supabase) {
      setSignedIn(false);
      return;
    }
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <header className="text-center">
          <div className="mb-4 animate-float text-6xl">💌</div>
          <h1 className="font-display text-4xl font-bold text-stone-800 sm:text-5xl">
            Group cards, made together
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600">
            Start a digital greeting card, invite friends to add messages and photos with one
            link, then send the finished wall to someone special.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/create"
              className="inline-block rounded-full bg-rose-600 px-8 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-rose-500 active:scale-[0.98]"
            >
              Create a card
            </Link>
            {signedIn ? (
              <Link
                href="/dashboard"
                className="inline-block rounded-full border border-stone-300 bg-white px-6 py-3 text-lg font-medium text-stone-700 transition hover:bg-stone-50"
              >
                My cards
              </Link>
            ) : (
              signedIn === false && (
                <Link
                  href="/login"
                  className="inline-block rounded-full border border-stone-300 bg-white px-6 py-3 text-lg font-medium text-stone-700 transition hover:bg-stone-50"
                >
                  Sign in
                </Link>
              )
            )}
          </div>
        </header>

        <section className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            { icon: '🎨', title: 'Pick a theme', body: 'Choose the occasion and a look that fits.' },
            { icon: '🔗', title: 'Share one link', body: 'Everyone adds a note — no accounts needed.' },
            { icon: '🎁', title: 'Send it off', body: 'The recipient unwraps a wall of messages.' },
          ].map((s) => (
            <div key={s.title} className="rounded-2xl bg-white/70 p-5 text-center tile-shadow">
              <div className="mb-2 text-3xl">{s.icon}</div>
              <h3 className="font-semibold text-stone-800">{s.title}</h3>
              <p className="mt-1 text-sm text-stone-600">{s.body}</p>
            </div>
          ))}
        </section>

        <p className="mt-10 text-center text-sm text-stone-500">
          Creating a card takes a quick sign-in. Friends who contribute and the people who receive
          it never need an account.
        </p>
      </div>
    </main>
  );
}
