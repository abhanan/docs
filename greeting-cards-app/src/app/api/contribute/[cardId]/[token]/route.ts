import 'server-only';
import { NextRequest } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { ok, fail, handleErrors } from '@/lib/api';
import { cleanString, isNonEmpty, LIMITS } from '@/lib/validate';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { toPublicCard, type Card, type Contributor } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function loadByContributorToken(cardId: string, token: string) {
  const supabase = getServiceClient();
  const { data: card } = await supabase
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .single<Card>();
  if (!card) return { error: fail(404, 'card not found') } as const;
  if (card.contributor_token !== token) return { error: fail(403, 'invalid link') } as const;
  return { card, supabase } as const;
}

/** GET — public card + existing contributions for the contribute page. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { cardId: string; token: string } },
) {
  try {
    const res = await loadByContributorToken(params.cardId, params.token);
    if ('error' in res) return res.error;
    const { card, supabase } = res;

    const { data: contributors } = await supabase
      .from('contributors')
      .select('*')
      .eq('card_id', card.id)
      .order('created_at', { ascending: true })
      .returns<Contributor[]>();

    return ok({ card: toPublicCard(card), contributors: contributors ?? [] });
  } catch (err) {
    return handleErrors(err);
  }
}

/**
 * M2 — Add a contribution. Body: { name, message, photo_url?, photo_key? }.
 * The photo was already uploaded to R2 by the browser via a presigned URL, so
 * only the resulting URL/key (text) is saved here — bytes never touch us.
 * Rate limited by IP as a basic spam/abuse guard.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { cardId: string; token: string } },
) {
  try {
    const ip = clientIp(req.headers);
    const rl = rateLimit(`contribute:${params.cardId}:${ip}`, {
      limit: 10,
      windowMs: 10 * 60 * 1000, // 10 posts / 10 min / IP / card
    });
    if (!rl.allowed) {
      return fail(429, 'Too many submissions. Please wait a moment and try again.', {
        resetAt: rl.resetAt,
      });
    }

    const res = await loadByContributorToken(params.cardId, params.token);
    if ('error' in res) return res.error;
    const { card, supabase } = res;

    if (card.status === 'closed' || card.status === 'expired') {
      return fail(409, 'This card is no longer accepting contributions.');
    }

    const body = await req.json().catch(() => ({}));
    const name = cleanString(body.name, LIMITS.name);
    const message = cleanString(body.message, LIMITS.message);
    if (!isNonEmpty(name)) return fail(400, 'name is required');
    if (!isNonEmpty(message)) return fail(400, 'message is required');

    const photo_url = cleanString(body.photo_url, 500) || null;
    const photo_key = cleanString(body.photo_key, 300) || null;

    const { data, error } = await supabase
      .from('contributors')
      .insert({ card_id: card.id, name, message, photo_url, photo_key })
      .select('*')
      .single<Contributor>();
    if (error) return fail(500, error.message);

    return ok({ contributor: data }, { status: 201 });
  } catch (err) {
    return handleErrors(err);
  }
}
