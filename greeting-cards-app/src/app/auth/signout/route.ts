import { NextRequest, NextResponse } from 'next/server';
import { getSSRServerClient } from '@/lib/supabase/ssr-server';

export const dynamic = 'force-dynamic';

/** Sign the creator out and return to the home page. */
export async function POST(request: NextRequest) {
  const supabase = getSSRServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/', request.url), { status: 303 });
}
