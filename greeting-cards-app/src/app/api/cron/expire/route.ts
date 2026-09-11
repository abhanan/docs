import 'server-only';
import { NextRequest } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { ok, fail, handleErrors } from '@/lib/api';
import { deleteR2Objects } from '@/lib/r2/storage';
import { r2Configured } from '@/lib/env';
import { isExpired } from '@/lib/expiry';
import type { Card, Contributor } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * M3 — Daily expiry job (Vercel Cron -> this route).
 *
 * Deletes cards where:
 *   now > first_viewed_at + 90 days   (opened, window elapsed)      OR
 *   first_viewed_at IS NULL AND now > fallback_expires_at   (never opened)
 *
 * For each expired card it deletes the card row (contributors + recipients
 * cascade via FK) AND the card's R2 photo objects.
 *
 * Auth: Bearer CRON_SECRET (Vercel Cron sets Authorization automatically when
 * configured, and you can also set it manually). If CRON_SECRET is unset, the
 * route refuses to run to avoid an open deletion endpoint.
 */
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // refuse to run without a secret (no open delete endpoint)
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

async function runExpiry() {
  const supabase = getServiceClient();
  const nowIso = new Date().toISOString();

  // Fetch candidate cards. Two conditions OR'd together.
  const { data: candidates, error } = await supabase
    .from('cards')
    .select('*')
    .neq('status', 'expired')
    .or(
      `and(first_viewed_at.not.is.null,first_viewed_at.lte.${cutoff90()}),` +
        `and(first_viewed_at.is.null,fallback_expires_at.lte.${nowIso})`,
    )
    .returns<Card[]>();
  if (error) throw new Error(error.message);

  const expired = (candidates ?? []).filter((c) => isExpired(c));
  if (expired.length === 0) {
    return { checked: candidates?.length ?? 0, expired: 0, photosDeleted: 0 };
  }

  const ids = expired.map((c) => c.id);

  // Collect R2 keys before deleting the rows.
  const { data: photos } = await supabase
    .from('contributors')
    .select('photo_key')
    .in('card_id', ids)
    .not('photo_key', 'is', null)
    .returns<Pick<Contributor, 'photo_key'>[]>();
  const keys = (photos ?? []).map((p) => p.photo_key).filter((k): k is string => Boolean(k));

  if (keys.length > 0 && r2Configured()) {
    await deleteR2Objects(keys);
  }

  // Deleting the card cascades to contributors + recipients (FK on delete cascade).
  const { error: delErr } = await supabase.from('cards').delete().in('id', ids);
  if (delErr) throw new Error(delErr.message);

  return { checked: candidates?.length ?? 0, expired: ids.length, photosDeleted: keys.length };
}

/** ISO timestamp for (now - 90 days), used in the SQL filter. */
function cutoff90(): string {
  return new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
}

export async function GET(req: NextRequest) {
  try {
    if (!authorized(req)) return fail(401, 'unauthorized');
    const result = await runExpiry();
    return ok({ ok: true, ...result });
  } catch (err) {
    return handleErrors(err);
  }
}

// Support POST too, for manual triggering / alternative schedulers.
export const POST = GET;
