'use client';

/**
 * Since creators have no accounts in v1, we remember the cards they've made in
 * localStorage so they can get back to the admin dashboard. This is a
 * convenience only — the creator_token in the link is the real credential.
 */
export interface SavedCard {
  cardId: string;
  creatorToken: string;
  title: string;
  occasion: string;
  createdAt: string;
}

const KEY = 'groupcard.mycards.v1';

export function loadMyCards(): SavedCard[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMyCard(card: SavedCard): void {
  try {
    const existing = loadMyCards().filter((c) => c.cardId !== card.cardId);
    localStorage.setItem(KEY, JSON.stringify([card, ...existing].slice(0, 50)));
  } catch {
    // ignore storage errors (private mode etc.)
  }
}

export function getOrCreateCreatorId(): string {
  try {
    const KEY_ID = 'groupcard.creatorid.v1';
    let id = localStorage.getItem(KEY_ID);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY_ID, id);
    }
    return id;
  } catch {
    return 'anon';
  }
}
