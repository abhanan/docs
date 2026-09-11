import 'server-only';
import { NextRequest } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { ok, fail, handleErrors } from '@/lib/api';
import { presignUpload, isAllowedImageType } from '@/lib/r2/storage';
import { r2Configured } from '@/lib/env';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import type { Card } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * M1/M2 — Return a presigned R2 PUT URL so the browser uploads the photo
 * directly to R2. Verifies the contributor token first so random callers can't
 * mint upload URLs. Body: { cardId, token, contentType }.
 */
export async function POST(req: NextRequest) {
  try {
    if (!r2Configured()) {
      return fail(503, 'Photo storage (R2) is not configured yet.', { code: 'r2_not_configured' });
    }

    const ip = clientIp(req.headers);
    const rl = rateLimit(`upload:${ip}`, { limit: 30, windowMs: 10 * 60 * 1000 });
    if (!rl.allowed) return fail(429, 'Too many uploads, slow down.');

    const body = await req.json().catch(() => ({}));
    const cardId = String(body.cardId ?? '');
    const token = String(body.token ?? '');
    const contentType = String(body.contentType ?? '');

    if (!cardId || !token) return fail(400, 'cardId and token are required');
    if (!isAllowedImageType(contentType)) return fail(400, 'unsupported image type');

    const supabase = getServiceClient();
    const { data: card } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single<Card>();
    if (!card) return fail(404, 'card not found');
    if (card.contributor_token !== token) return fail(403, 'invalid link');
    if (card.status === 'closed' || card.status === 'expired') {
      return fail(409, 'This card is no longer accepting contributions.');
    }

    const result = await presignUpload({ cardId, contentType });
    return ok(result);
  } catch (err) {
    return handleErrors(err);
  }
}
