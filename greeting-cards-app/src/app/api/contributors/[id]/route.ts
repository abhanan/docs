import 'server-only';
import { NextRequest } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { ok, fail, handleErrors } from '@/lib/api';
import { deleteR2Objects } from '@/lib/r2/storage';
import { r2Configured } from '@/lib/env';
import type { Card, Contributor } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * M5 — Moderation: creator deletes an individual contribution before sending.
 * Requires the creator_token. Also removes the associated R2 photo object.
 * Body: { admin }.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json().catch(() => ({}));
    const admin = body.admin ?? req.nextUrl.searchParams.get('admin');
    if (!admin) return fail(401, 'creator token required');

    const supabase = getServiceClient();
    const { data: contributor } = await supabase
      .from('contributors')
      .select('*')
      .eq('id', params.id)
      .single<Contributor>();
    if (!contributor) return fail(404, 'contribution not found');

    const { data: card } = await supabase
      .from('cards')
      .select('*')
      .eq('id', contributor.card_id)
      .single<Card>();
    if (!card) return fail(404, 'card not found');
    if (card.creator_token !== admin) return fail(403, 'forbidden');

    const { error } = await supabase.from('contributors').delete().eq('id', contributor.id);
    if (error) return fail(500, error.message);

    if (contributor.photo_key && r2Configured()) {
      try {
        await deleteR2Objects([contributor.photo_key]);
      } catch (e) {
        // Row is already gone; log and continue rather than failing the request.
        console.error('[contributors:delete] R2 cleanup failed', e);
      }
    }

    return ok({ deleted: true });
  } catch (err) {
    return handleErrors(err);
  }
}
