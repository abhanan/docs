import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/supabase/ssr-server';
import { MyCards } from './MyCards';

export const dynamic = 'force-dynamic';

/** v2 — "My Cards": the signed-in creator's home. Server-gated. */
export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/dashboard');
  return <MyCards email={user.email ?? ''} />;
}
