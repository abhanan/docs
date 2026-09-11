'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Wall } from '@/components/Wall';
import { Countdown } from '@/components/Countdown';
import { ExportButton } from '@/components/ExportButton';
import { getTheme } from '@/lib/themes';
import type { PublicCard, Contributor } from '@/lib/types';

interface ViewData {
  card: PublicCard;
  recipientName: string;
  contributors: Contributor[];
  firstView: boolean;
}

export default function RecipientView({
  params,
}: {
  params: { cardId: string; token: string };
}) {
  const { cardId, token } = params;
  const [data, setData] = useState<ViewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/view/${cardId}/${token}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.status === 410) {
        setExpired(true);
        return;
      }
      if (!res.ok) throw new Error(json.error || 'This link is not valid.');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [cardId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const theme = useMemo(() => getTheme(data?.card.theme_id), [data?.card.theme_id]);

  if (loading) return <CenterMsg>Loading your card…</CenterMsg>;
  if (expired) {
    return (
      <CenterMsg>
        <div className="text-5xl">🕰️</div>
        <p className="mt-3 text-lg text-stone-700">This card has expired.</p>
        <p className="mt-1 text-sm text-stone-500">
          Cards are kept for 90 days after they&apos;re first opened.
        </p>
      </CenterMsg>
    );
  }
  if (error || !data) {
    return (
      <CenterMsg>
        <div className="text-4xl">🔗</div>
        <p className="mt-2 text-red-600">{error || 'This link is not valid.'}</p>
      </CenterMsg>
    );
  }

  const { card, recipientName, contributors } = data;

  // Reveal / unwrap screen (M3)
  if (!revealed) {
    return (
      <main className={`flex min-h-screen items-center justify-center ${theme.bg} px-4`}>
        <div className="text-center">
          <div className="mb-6 animate-float text-7xl">{theme.motif}</div>
          <p className="text-lg text-stone-600">
            {recipientName}, you have a card
            {card.recipient_label && card.recipient_label !== recipientName ? '' : ''}!
          </p>
          <h1 className={`mt-2 font-display text-4xl font-bold ${theme.accent}`}>
            {card.title || `A ${card.occasion} card`}
          </h1>
          <button
            onClick={() => setRevealed(true)}
            className="mt-8 rounded-full bg-rose-600 px-8 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-rose-500 active:scale-[0.98]"
          >
            Tap to unwrap 🎁
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${theme.bg}`}>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <header className="animate-unwrap text-center">
          <div className="mb-2 text-4xl">{theme.motif}</div>
          <h1 className={`font-display text-4xl font-bold ${theme.accent}`}>
            {card.title || `A ${card.occasion} card`}
          </h1>
          {card.recipient_label && (
            <p className="mt-1 text-lg text-stone-600">for {card.recipient_label}</p>
          )}
          <p className="mt-3 text-sm text-stone-500">
            <Countdown card={card} />
          </p>
        </header>

        <div id="recipient-wall" className={`mt-8 rounded-2xl ${theme.bg} p-1`}>
          <Wall
            cardId={cardId}
            theme={theme}
            initial={contributors}
            live={card.status !== 'closed'}
            emptyHint="This card doesn't have any messages yet."
          />
        </div>

        <div className="mt-10 text-center">
          <p className="mb-3 text-sm text-stone-500">Keep a copy before it expires:</p>
          <ExportButton
            targetId="recipient-wall"
            filename={(card.title || card.occasion).replace(/\s+/g, '-')}
          />
        </div>
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
