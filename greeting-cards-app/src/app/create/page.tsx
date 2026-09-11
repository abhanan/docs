'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { OCCASIONS } from '@/lib/themes';
import { ThemePicker } from '@/components/ThemePicker';
import { saveMyCard, getOrCreateCreatorId } from '@/lib/mycards';
import type { Card } from '@/lib/types';

export default function CreatePage() {
  const router = useRouter();
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [customOccasion, setCustomOccasion] = useState('');
  const [themeId, setThemeId] = useState('classic');
  const [title, setTitle] = useState('');
  const [recipientLabel, setRecipientLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const finalOccasion = occasion === '__custom__' ? customOccasion.trim() : occasion;
      if (!finalOccasion) {
        setError('Please choose or type an occasion.');
        setSubmitting(false);
        return;
      }
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          occasion: finalOccasion,
          theme_id: themeId,
          title: title.trim() || null,
          recipient_label: recipientLabel.trim() || null,
          creator_id: getOrCreateCreatorId(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create the card.');

      const card: Card = data.card;
      saveMyCard({
        cardId: card.id,
        creatorToken: card.creator_token,
        title: card.title || '',
        occasion: card.occasion,
        createdAt: card.created_at,
      });
      router.push(`/card/${card.id}/${card.creator_token}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-700">
          ← Home
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold text-stone-800">Create a card</h1>
        <p className="mt-1 text-stone-600">Set the occasion and pick a theme to get started.</p>

        <form onSubmit={submit} className="mt-8 space-y-6 rounded-2xl bg-white/80 p-6 tile-shadow">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Occasion</label>
            <select
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
            >
              {OCCASIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
              <option value="__custom__">Something else…</option>
            </select>
            {occasion === '__custom__' && (
              <input
                value={customOccasion}
                onChange={(e) => setCustomOccasion(e.target.value)}
                placeholder="e.g. Retirement"
                maxLength={60}
                className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Card title <span className="font-normal text-stone-400">(optional)</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Happy Birthday, Sam!"
              maxLength={120}
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Who is it for? <span className="font-normal text-stone-400">(optional)</span>
            </label>
            <input
              value={recipientLabel}
              onChange={(e) => setRecipientLabel(e.target.value)}
              placeholder="Sam"
              maxLength={120}
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">Theme</label>
            <ThemePicker value={themeId} onChange={setThemeId} />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-rose-600 px-6 py-3 text-lg font-semibold text-white shadow transition hover:bg-rose-500 disabled:opacity-60"
          >
            {submitting ? 'Creating…' : 'Create card & get link'}
          </button>
        </form>
      </div>
    </main>
  );
}
