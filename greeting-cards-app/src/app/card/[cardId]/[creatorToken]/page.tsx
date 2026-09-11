'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CopyField } from '@/components/CopyField';
import { Wall } from '@/components/Wall';
import { ExportButton } from '@/components/ExportButton';
import { getTheme } from '@/lib/themes';
import { contributeLink, recipientLink } from '@/lib/links';
import type { Card, Contributor, Recipient } from '@/lib/types';

interface DashboardData {
  card: Card;
  contributors: Contributor[];
  recipients: Recipient[];
}

export default function CreatorDashboard({
  params,
}: {
  params: { cardId: string; creatorToken: string };
}) {
  const { cardId, creatorToken } = params;
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNames, setNewNames] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/cards/${cardId}?admin=${encodeURIComponent(creatorToken)}`,
        { cache: 'no-store' },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not load card.');
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [cardId, creatorToken]);

  useEffect(() => {
    load();
  }, [load]);

  const theme = useMemo(() => getTheme(data?.card.theme_id), [data?.card.theme_id]);

  async function toggleStatus() {
    if (!data) return;
    setBusy(true);
    const next = data.card.status === 'closed' ? 'open' : 'closed';
    await fetch(`/api/cards/${cardId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ admin: creatorToken, status: next }),
    });
    await load();
    setBusy(false);
  }

  async function addRecipients(e: React.FormEvent) {
    e.preventDefault();
    const names = newNames
      .split(/[\n,]/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    setBusy(true);
    await fetch(`/api/cards/${cardId}/recipients`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ admin: creatorToken, names }),
    });
    setNewNames('');
    await load();
    setBusy(false);
  }

  const deleteContribution = useCallback(
    async (id: string) => {
      await fetch(`/api/contributors/${id}`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ admin: creatorToken }),
      });
      await load();
    },
    [creatorToken, load],
  );

  if (loading) {
    return <CenterMsg>Loading your card…</CenterMsg>;
  }
  if (error || !data) {
    return (
      <CenterMsg>
        <p className="text-red-600">{error || 'Card not found.'}</p>
        <Link href="/" className="mt-3 inline-block text-sm text-stone-500 underline">
          Go home
        </Link>
      </CenterMsg>
    );
  }

  const { card, contributors, recipients } = data;
  const cLink = contributeLink(card.id, card.contributor_token);

  return (
    <main className={`min-h-screen ${theme.bg}`}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Link href="/" className="text-sm text-stone-500 hover:text-stone-700">
              ← Home
            </Link>
            <h1 className="font-display text-3xl font-bold text-stone-800">
              {card.title || card.occasion}
            </h1>
            <p className="text-stone-600">
              {card.occasion}
              {card.recipient_label ? ` · for ${card.recipient_label}` : ''} ·{' '}
              <span className="capitalize">{card.status}</span>
            </p>
          </div>
          <span className="rounded-full bg-white/70 px-3 py-1 text-sm text-stone-600">
            {contributors.length} message{contributors.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Step 1: invite contributors */}
        <section className="mt-6 rounded-2xl bg-white/85 p-5 tile-shadow">
          <h2 className="mb-1 font-semibold text-stone-800">1. Invite people to sign the card</h2>
          <p className="mb-3 text-sm text-stone-600">
            Share this link with everyone who should add a message. No accounts needed.
          </p>
          <CopyField value={cLink} />
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={toggleStatus}
              disabled={busy}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
            >
              {card.status === 'closed' ? 'Reopen contributions' : 'Close contributions'}
            </button>
            {card.status === 'closed' && (
              <span className="text-sm text-amber-700">Card is closed to new messages.</span>
            )}
          </div>
        </section>

        {/* Step 2: recipient links */}
        <section className="mt-6 rounded-2xl bg-white/85 p-5 tile-shadow">
          <h2 className="mb-1 font-semibold text-stone-800">2. Send it to the recipient(s)</h2>
          <p className="mb-3 text-sm text-stone-600">
            Add each recipient (a couple can have one link each). Their first open starts the
            90-day countdown.
          </p>
          <form onSubmit={addRecipients} className="flex flex-col gap-2 sm:flex-row">
            <input
              value={newNames}
              onChange={(e) => setNewNames(e.target.value)}
              placeholder="Recipient name(s), comma-separated"
              className="flex-1 rounded-lg border border-stone-300 px-3 py-2"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
            >
              Generate link
            </button>
          </form>

          {recipients.length > 0 && (
            <ul className="mt-4 space-y-3">
              {recipients.map((r) => (
                <li key={r.id}>
                  <CopyField
                    label={`${r.name}${r.viewed_at ? ' · opened ✓' : ' · not opened yet'}`}
                    value={recipientLink(card.id, r.access_token)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Step 3: preview + moderate + export */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-stone-800">3. Preview & tidy up</h2>
            <ExportButton targetId="preview-wall" filename={(card.title || card.occasion).replace(/\s+/g, '-')} />
          </div>
          <p className="mb-4 text-sm text-stone-600">
            Hover a message to remove it before sending. Contributions appear here live.
          </p>
          <div id="preview-wall" className={`rounded-2xl ${theme.bg} p-4`}>
            {card.title && (
              <h3 className={`mb-4 text-center font-display text-2xl font-bold ${theme.accent}`}>
                {card.title}
              </h3>
            )}
            <Wall
              cardId={card.id}
              theme={theme}
              initial={contributors}
              onDelete={deleteContribution}
              emptyHint="Messages will show up here as people contribute."
            />
          </div>
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
