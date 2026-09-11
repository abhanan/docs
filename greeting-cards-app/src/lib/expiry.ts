import type { Card, PublicCard } from './types';

export const VIEW_WINDOW_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The effective expiry moment for a card:
 *   - if opened:  first_viewed_at + 90 days
 *   - if never opened: fallback_expires_at (created_at + 6 months)
 */
export function expiryDate(card: Pick<Card | PublicCard, 'first_viewed_at' | 'fallback_expires_at'>): Date {
  if (card.first_viewed_at) {
    return new Date(new Date(card.first_viewed_at).getTime() + VIEW_WINDOW_DAYS * DAY_MS);
  }
  return new Date(card.fallback_expires_at);
}

export function isExpired(
  card: Pick<Card | PublicCard, 'first_viewed_at' | 'fallback_expires_at'>,
  now: Date = new Date(),
): boolean {
  return now.getTime() > expiryDate(card).getTime();
}

export interface Countdown {
  expiresAt: Date;
  msRemaining: number;
  days: number;
  hours: number;
  minutes: number;
  expired: boolean;
  started: boolean; // has the 90-day clock started (first view happened)
}

export function countdown(
  card: Pick<Card | PublicCard, 'first_viewed_at' | 'fallback_expires_at'>,
  now: Date = new Date(),
): Countdown {
  const expiresAt = expiryDate(card);
  const msRemaining = Math.max(0, expiresAt.getTime() - now.getTime());
  return {
    expiresAt,
    msRemaining,
    days: Math.floor(msRemaining / DAY_MS),
    hours: Math.floor((msRemaining % DAY_MS) / (60 * 60 * 1000)),
    minutes: Math.floor((msRemaining % (60 * 60 * 1000)) / (60 * 1000)),
    expired: msRemaining <= 0,
    started: Boolean(card.first_viewed_at),
  };
}
