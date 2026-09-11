'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadMyCards, type SavedCard } from '@/lib/mycards';
import { creatorLink } from '@/lib/links';

export default function HomePage() {
  const [mine, setMine] = useState<SavedCard[]>([]);

  useEffect(() => {
    setMine(loadMyCards());
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
          <div className="mt-8">
            <Link
              href="/create"
              className="inline-block rounded-full bg-rose-600 px-8 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-rose-500 active:scale-[0.98]"
            >
              Create a card
            </Link>
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

        {mine.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
              Your cards
            </h2>
            <ul className="space-y-2">
              {mine.map((c) => (
                <li key={c.cardId}>
                  <Link
                    href={creatorLink(c.cardId, c.creatorToken)}
                    className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-3 tile-shadow transition hover:bg-white"
                  >
                    <span className="font-medium text-stone-800">
                      {c.title || c.occasion}
                    </span>
                    <span className="text-sm text-stone-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
