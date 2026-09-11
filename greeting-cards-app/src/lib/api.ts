import 'server-only';
import { NextResponse } from 'next/server';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Wrap a handler so config/DB errors return clean JSON instead of a 500 page. */
export function handleErrors(err: unknown) {
  const message = err instanceof Error ? err.message : 'Unexpected error';
  // Config problems (missing env) are the most common during setup — 503.
  if (message.includes('Missing required') || message.includes('env')) {
    return fail(503, message, { code: 'not_configured' });
  }
  console.error('[api]', err);
  return fail(500, message);
}
