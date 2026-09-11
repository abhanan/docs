import 'server-only';
import { NextRequest } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { ok, fail, handleErrors } from '@/lib/api';
import { cleanString, isNonEmpty, LIMITS } from '@/lib/validate';
import type { Card, Recipient } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function verifyCreator(cardId: string, adminToken: string | null) {
  if (!adminToken) return { error: fail(401, 'creator token required') } as const;
  const supabase = getServiceClient();
  const { data: card } = await supabase
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .single<Card>();
  if (!card) return { error: fail(404, 'card not found') } as const;
  if (card.creator_token !== adminToken) return { error: fail(403, 'forbidden') } as const;
  return { card, supabase } as const;
}

/**
 * M3 — Creator generates recipient link(s). Supports multiple recipients per
 * card (e.g. a couple). Body: { admin, names: string[] }.
 * Each recipient gets a unique access_token (its personal link).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { cardId: string } },
) {
  try {
    const body = await req.json().catch(() => ({}));
    const res = await verifyCreator(params.cardId, body.admin ?? null);
    if ('error' in res) return res.error;
    const { card, supabase } = res;

    const rawNames: unknown = body.names;
    const names = Array.isArray(rawNames)
      ? rawNames.map((n) => cleanString(n, LIMITS.name)).filter(isNonEmpty)
      : [];
    if (names.length === 0) return fail(400, 'at least one recipient name is required');
    if (names.length > 20) return fail(400, 'too many recipients (max 20)');

    const { data, error } = await supabase
      .from('recipients')
      .insert(names.map((name) => ({ card_id: card.id, name })))
      .select('*')
      .returns<Recipient[]>();
    if (error) return fail(500, error.message);

    return ok({ recipients: data ?? [] }, { status: 201 });
  } catch (err) {
    return handleErrors(err);
  }
}
