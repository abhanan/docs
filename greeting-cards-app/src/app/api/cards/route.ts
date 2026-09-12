import 'server-only';
import { NextRequest } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/supabase/ssr-server';
import { ok, fail, handleErrors } from '@/lib/api';
import { cleanString, isNonEmpty, LIMITS } from '@/lib/validate';
import { getTheme } from '@/lib/themes';
import type { Card } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * M1 + v2 accounts — Create a card. Requires a signed-in creator; the card is
 * stamped with owner_id = the authenticated user's id so it shows in their
 * "My Cards" dashboard.
 * Body: { occasion, theme_id, title?, recipient_label? }
 * Returns the full card including creator_token + contributor_token.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return fail(401, 'Please sign in to create a card.', { code: 'auth_required' });

    const body = await req.json().catch(() => ({}));
    const occasion = cleanString(body.occasion, LIMITS.occasion);
    if (!isNonEmpty(occasion)) return fail(400, 'occasion is required');

    const theme_id = getTheme(cleanString(body.theme_id, 40)).id;
    const title = cleanString(body.title, LIMITS.title) || null;
    const recipient_label = cleanString(body.recipient_label, LIMITS.recipientLabel) || null;

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('cards')
      .insert({
        occasion,
        theme_id,
        title,
        recipient_label,
        creator_id: user.id,
        owner_id: user.id,
        status: 'open',
      })
      .select('*')
      .single<Card>();

    if (error) return fail(500, error.message);
    return ok({ card: data }, { status: 201 });
  } catch (err) {
    return handleErrors(err);
  }
}
