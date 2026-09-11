import 'server-only';
import { NextRequest } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { ok, fail, handleErrors } from '@/lib/api';
import { isExpired } from '@/lib/expiry';
import { toPublicCard, type Card, type Contributor, type Recipient } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * M3 — Recipient view. Validates the recipient access_token, then records the
 * view. The first recipient to open ANY link stamps cards.first_viewed_at (in
 * a single DB transaction via the record_recipient_view RPC), starting the
 * shared 90-day expiry clock. Returns the wall of contributions + countdown data.
 *
 * ?peek=1 loads without recording a view (used by the creator preview).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { cardId: string; token: string } },
) {
  try {
    const supabase = getServiceClient();
    const peek = req.nextUrl.searchParams.get('peek') === '1';

    const { data: recipient } = await supabase
      .from('recipients')
      .select('*')
      .eq('access_token', params.token)
      .eq('card_id', params.cardId)
      .single<Recipient>();
    if (!recipient) return fail(404, 'invalid link');

    let { data: card } = await supabase
      .from('cards')
      .select('*')
      .eq('id', params.cardId)
      .single<Card>();
    if (!card) return fail(404, 'card not found');

    if (isExpired(card)) {
      return fail(410, 'This card has expired.', { expired: true });
    }

    const alreadyViewed = Boolean(recipient.viewed_at);

    if (!peek) {
      // Atomically mark this recipient viewed + stamp first_viewed_at if first.
      const { data: rpc, error: rpcErr } = await supabase.rpc('record_recipient_view', {
        p_recipient_id: recipient.id,
      });
      if (rpcErr) return fail(500, rpcErr.message);
      // Refresh card to reflect first_viewed_at.
      const refreshed = Array.isArray(rpc) ? rpc[0] : rpc;
      if (refreshed?.first_viewed_at) {
        card = { ...card, first_viewed_at: refreshed.first_viewed_at };
      }
    }

    const { data: contributors } = await supabase
      .from('contributors')
      .select('*')
      .eq('card_id', card.id)
      .order('created_at', { ascending: true })
      .returns<Contributor[]>();

    return ok({
      card: toPublicCard(card),
      recipientName: recipient.name,
      contributors: contributors ?? [],
      firstView: !alreadyViewed && !peek,
    });
  } catch (err) {
    return handleErrors(err);
  }
}
