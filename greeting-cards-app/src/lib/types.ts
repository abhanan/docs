export type CardStatus = 'draft' | 'open' | 'closed' | 'expired';

export interface Card {
  id: string;
  occasion: string;
  theme_id: string;
  title: string | null;
  recipient_label: string | null;
  creator_id: string | null;
  creator_token: string;
  contributor_token: string;
  status: CardStatus;
  created_at: string;
  first_viewed_at: string | null;
  fallback_expires_at: string;
}

export interface Contributor {
  id: string;
  card_id: string;
  name: string;
  message: string;
  photo_url: string | null;
  photo_key: string | null;
  created_at: string;
}

export interface Recipient {
  id: string;
  card_id: string;
  name: string;
  access_token: string;
  viewed_at: string | null;
  created_at: string;
}

/** Card shape safe to send to a contributor (no admin/recipient tokens). */
export interface PublicCard {
  id: string;
  occasion: string;
  theme_id: string;
  title: string | null;
  recipient_label: string | null;
  status: CardStatus;
  first_viewed_at: string | null;
  fallback_expires_at: string;
}

export function toPublicCard(card: Card): PublicCard {
  return {
    id: card.id,
    occasion: card.occasion,
    theme_id: card.theme_id,
    title: card.title,
    recipient_label: card.recipient_label,
    status: card.status,
    first_viewed_at: card.first_viewed_at,
    fallback_expires_at: card.fallback_expires_at,
  };
}
