'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Contributor } from '@/lib/types';
import type { Theme } from '@/lib/themes';
import { getBrowserClient } from '@/lib/supabase/client';
import { ContributionTile } from './ContributionTile';

/**
 * Live-updating wall of contributions (M2). Seeds from server-provided rows,
 * then subscribes to Supabase Realtime for INSERT/DELETE on this card so new
 * messages appear without a refresh.
 */
export function Wall({
  cardId,
  theme,
  initial,
  live = true,
  onDelete,
  emptyHint,
}: {
  cardId: string;
  theme: Theme;
  initial: Contributor[];
  live?: boolean;
  onDelete?: (id: string) => void;
  emptyHint?: string;
}) {
  const [items, setItems] = useState<Contributor[]>(initial);

  // Keep in sync if the parent replaces the initial list (e.g. after refetch).
  useEffect(() => {
    setItems(initial);
  }, [initial]);

  useEffect(() => {
    if (!live) return;
    const supabase = getBrowserClient();
    if (!supabase) return; // Supabase not configured yet — static wall still works.

    const channel = supabase
      .channel(`wall:${cardId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'contributors', filter: `card_id=eq.${cardId}` },
        (payload) => {
          const row = payload.new as Contributor;
          setItems((prev) => (prev.some((c) => c.id === row.id) ? prev : [...prev, row]));
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'contributors', filter: `card_id=eq.${cardId}` },
        (payload) => {
          const oldRow = payload.old as { id: string };
          setItems((prev) => prev.filter((c) => c.id !== oldRow.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cardId, live]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [items],
  );

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white/50 p-10 text-center">
        <div className="mb-2 text-4xl">{theme.motif}</div>
        <p className="text-stone-500">{emptyHint ?? 'No messages yet.'}</p>
      </div>
    );
  }

  return (
    <div className="wall-columns group">
      {sorted.map((c) => (
        <ContributionTile key={c.id} contributor={c} theme={theme} onDelete={onDelete} />
      ))}
    </div>
  );
}
