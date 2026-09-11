'use client';
import { useEffect, useState } from 'react';
import { countdown } from '@/lib/expiry';
import type { PublicCard } from '@/lib/types';

/**
 * Shows the expiry countdown on the recipient page (M3). Once a recipient has
 * opened the card, the 90-day clock is running; before any view it shows the
 * fallback window instead.
 */
export function Countdown({ card }: { card: Pick<PublicCard, 'first_viewed_at' | 'fallback_expires_at'> }) {
  const [state, setState] = useState(() => countdown(card));

  useEffect(() => {
    const tick = () => setState(countdown(card));
    tick();
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, [card]);

  if (state.expired) {
    return <span className="text-red-600">This card has expired.</span>;
  }

  const parts: string[] = [];
  if (state.days > 0) parts.push(`${state.days} day${state.days === 1 ? '' : 's'}`);
  if (state.days < 3) parts.push(`${state.hours}h`);
  const remaining = parts.join(' ');

  return (
    <span>
      {state.started ? 'Available for ' : 'Held for '}
      <strong>{remaining}</strong>
      {state.started ? '' : ' (until first opened)'}
    </span>
  );
}
