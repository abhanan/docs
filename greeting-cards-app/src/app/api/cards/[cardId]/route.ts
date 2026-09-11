import 'server-only';
import { NextRequest } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { ok, fail, handleErrors } from '@/lib/api';
import type { Card, Contributor, Recipient } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Load a card and verify the caller holds the creator_token (admin).
 * The creator token is passed as ?admin=<creator_token>.
 */
async function loadAsCreator(cardId: string, adminToken: string | null) {
  if (!adminToken) return { error: fail(401, 'creator token required') } as const;
  const supabase = getServiceClient();
  const { data: card, error } = await supabase
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .single<Card>();
  if (error || !card) return { error: fail(404, 'card not found') } as const;
  if (card.creator_token !== adminToken) return { error: fail(403, 'forbidden') } as const;
  return { card, supabase } as const;
}

/** GET /api/cards/:cardId?admin=TOKEN — creator dashboard data. */
export async function GET(
  req: NextRequest,
  { params }: { params: { cardId: string } },
) {
  try {
    const admin = req.nextUrl.searchParams.get('admin');
    const res = await loadAsCreator(params.cardId, admin);
    if ('error' in res) return res.error;
    const { card, supabase } = res;

    const [{ data: contributors }, { data: recipients }] = await Promise.all([
      supabase
        .from('contributors')
        .select('*')
        .eq('card_id', card.id)
        .order('created_at', { ascending: true })
        .returns<Contributor[]>(),
      supabase
        .from('recipients')
        .select('*')
        .eq('card_id', card.id)
        .order('created_at', { ascending: true })
        .returns<Recipient[]>(),
    ]);

    return ok({ card, contributors: contributors ?? [], recipients: recipients ?? [] });
  } catch (err) {
    return handleErrors(err);
  }
}

/**
 * PATCH /api/cards/:cardId — creator updates status (open/closed) or metadata.
 * Body: { admin, status?, title?, theme_id? }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { cardId: string } },
) {
  try {
    const body = await req.json().catch(() => ({}));
    const res = await loadAsCreator(params.cardId, body.admin ?? null);
    if ('error' in res) return res.error;
    const { card, supabase } = res;

    const patch: Record<string, unknown> = {};
    if (body.status === 'open' || body.status === 'closed') patch.status = body.status;
    if (typeof body.title === 'string') patch.title = body.title.trim().slice(0, 120) || null;
    if (typeof body.theme_id === 'string') patch.theme_id = body.theme_id.slice(0, 40);

    if (Object.keys(patch).length === 0) return fail(400, 'nothing to update');

    const { data, error } = await supabase
      .from('cards')
      .update(patch)
      .eq('id', card.id)
      .select('*')
      .single<Card>();
    if (error) return fail(500, error.message);
    return ok({ card: data });
  } catch (err) {
    return handleErrors(err);
  }
}
