'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { creatorLink } from '@/lib/links';
import { getTheme } from '@/lib/themes';
import type { Card } from '@/lib/types';

interface CardWithCount extends Card {
  contributor_count: number;
}

export function MyCards({ email }: { email: string }) {
  const [cards, setCards] = useState<CardWithCount[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/my/cards', { cache: 'no-store' })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Could not load your cards.');
        setCards(j.cards);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-stone-800">Your cards</h1>
            {email && <p className="text-sm text-stone-500">Signed in as {email}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/create"
              className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-rose-500"
            >
              + New card
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        {error && (
          <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {cards === null && !error && <p className="mt-8 text-stone-500">Loading…</p>}

        {cards !== null && cards.length === 0 && (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-stone-300 bg-white/50 p-10 text-center">
            <div className="mb-2 text-4xl">💌</div>
            <p className="text-stone-600">You haven&apos;t created any cards yet.</p>
            <Link
              href="/create"
              className="mt-4 inline-block rounded-full bg-rose-600 px-6 py-2.5 font-semibold text-white shadow hover:bg-rose-500"
            >
              Create your first card
            </Link>
          </div>
        )}

        {cards && cards.length > 0 && (
          <ul className="mt-6 space-y-3">
            {cards.map((c) => {
              const theme = getTheme(c.theme_id);
              return (
                <li key={c.id}>
                  <Link
                    href={creatorLink(c.id, c.creator_token)}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white/85 px-4 py-3 tile-shadow transition hover:bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl ${theme.bg}`}>
                        {theme.motif}
                      </span>
                      <div>
                        <div className="font-medium text-stone-800">{c.title || c.occasion}</div>
                        <div className="text-xs text-stone-500">
                          {c.occasion} · <span className="capitalize">{c.status}</span> ·{' '}
                          {c.contributor_count} message{c.contributor_count === 1 ? '' : 's'}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-stone-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
