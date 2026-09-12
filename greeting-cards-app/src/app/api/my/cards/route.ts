import 'server-only';
import { getServiceClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/supabase/ssr-server';
import { ok, fail, handleErrors } from '@/lib/api';
import type { Card } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface CardWithCount extends Card {
  contributor_count: number;
}

/**
 * v2 — List the signed-in creator's cards for the "My Cards" dashboard.
 * Verifies the session, then reads that owner's cards (+ a message count each)
 * via the service role.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return fail(401, 'not signed in', { code: 'auth_required' });

    const supabase = getServiceClient();
    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .returns<Card[]>();
    if (error) return fail(500, error.message);

    const list = cards ?? [];
    // Attach a lightweight message count per card.
    const withCounts: CardWithCount[] = await Promise.all(
      list.map(async (card) => {
        const { count } = await supabase
          .from('contributors')
          .select('id', { count: 'exact', head: true })
          .eq('card_id', card.id);
        return { ...card, contributor_count: count ?? 0 };
      }),
    );

    return ok({ cards: withCounts, email: user.email ?? null });
  } catch (err) {
    return handleErrors(err);
  }
}
