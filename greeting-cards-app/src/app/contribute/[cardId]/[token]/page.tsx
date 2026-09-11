'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ContributeForm } from '@/components/ContributeForm';
import { Wall } from '@/components/Wall';
import { getTheme } from '@/lib/themes';
import type { PublicCard, Contributor } from '@/lib/types';

export default function ContributePage({
  params,
}: {
  params: { cardId: string; token: string };
}) {
  const { cardId, token } = params;
  const [card, setCard] = useState<PublicCard | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/contribute/${cardId}/${token}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'This link is not valid.');
      setCard(json.card);
      setContributors(json.contributors ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [cardId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const theme = useMemo(() => getTheme(card?.theme_id), [card?.theme_id]);
  const onAdded = useCallback((c: Contributor) => {
    setContributors((prev) => (prev.some((p) => p.id === c.id) ? prev : [...prev, c]));
  }, []);

  if (loading) return <CenterMsg>Loading…</CenterMsg>;
  if (error || !card) {
    return (
      <CenterMsg>
        <div className="text-4xl">🔗</div>
        <p className="mt-2 text-red-600">{error || 'This link is not valid.'}</p>
      </CenterMsg>
    );
  }

  const closed = card.status === 'closed' || card.status === 'expired';

  return (
    <main className={`min-h-screen ${theme.bg}`}>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8 text-center">
          <div className="mb-2 text-4xl">{theme.motif}</div>
          <h1 className={`font-display text-3xl font-bold ${theme.accent}`}>
            {card.title || `A ${card.occasion} card`}
          </h1>
          <p className="mt-1 text-stone-600">
            {card.recipient_label
              ? `Add your message for ${card.recipient_label}.`
              : 'Add your message to this group card.'}
          </p>
        </header>

        {closed ? (
          <div className="rounded-2xl bg-white/90 p-6 text-center tile-shadow">
            <p className="font-medium text-stone-800">
              This card is closed to new messages. Thanks for stopping by!
            </p>
          </div>
        ) : (
          <ContributeForm cardId={cardId} token={token} onAdded={onAdded} />
        )}

        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-500">
            {contributors.length} message{contributors.length === 1 ? '' : 's'} so far
          </h2>
          <Wall
            cardId={cardId}
            theme={theme}
            initial={contributors}
            emptyHint="Be the first to add a message!"
          />
        </section>
      </div>
    </main>
  );
}

function CenterMsg({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 text-center">
      <div>{children}</div>
    </main>
  );
}
