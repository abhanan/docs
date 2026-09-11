import 'server-only';
import { NextRequest } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { ok, fail, handleErrors } from '@/lib/api';
import { cleanString, isNonEmpty, LIMITS } from '@/lib/validate';
import { getTheme } from '@/lib/themes';
import type { Card } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * M1 — Create a card (creator flow).
 * Body: { occasion, theme_id, title?, recipient_label?, creator_id? }
 * Returns the full card including creator_token + contributor_token so the
 * client can build the admin and contributor links.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const occasion = cleanString(body.occasion, LIMITS.occasion);
    if (!isNonEmpty(occasion)) return fail(400, 'occasion is required');

    const theme_id = getTheme(cleanString(body.theme_id, 40)).id;
    const title = cleanString(body.title, LIMITS.title) || null;
    const recipient_label = cleanString(body.recipient_label, LIMITS.recipientLabel) || null;
    const creator_id = cleanString(body.creator_id, 80) || null;

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('cards')
      .insert({ occasion, theme_id, title, recipient_label, creator_id, status: 'open' })
      .select('*')
      .single<Card>();

    if (error) return fail(500, error.message);
    return ok({ card: data }, { status: 201 });
  } catch (err) {
    return handleErrors(err);
  }
}
