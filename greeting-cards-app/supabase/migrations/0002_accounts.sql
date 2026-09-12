-- ===========================================================================
-- Creator accounts (v2)
-- ===========================================================================
-- Adds an authenticated owner to cards so signed-in creators get a real
-- "My Cards" list, while contributors and recipients stay completely loginless.
--
-- Run this AFTER 0001_init.sql, in the Supabase SQL editor.
--
-- Enable the providers in the Supabase dashboard first/after:
--   Authentication → Providers → Google (client id + secret)
--   Authentication → Providers → Email → enable "Email OTP" (magic link)
--   Authentication → URL Configuration → Site URL + Redirect URLs (/auth/callback)
-- ===========================================================================

-- New nullable owner column. Legacy anonymous cards keep owner_id = NULL and
-- continue to work via their creator_token link. New cards created while signed
-- in get owner_id = auth.uid().
alter table public.cards
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

create index if not exists cards_owner_id_idx on public.cards (owner_id);

-- --------------------------------------------------------------------------
-- RLS for authenticated owners (defense in depth; server routes still use the
-- service role and validate ownership in code).
-- --------------------------------------------------------------------------
drop policy if exists "owners read their cards"   on public.cards;
drop policy if exists "owners update their cards"  on public.cards;
drop policy if exists "owners delete their cards"  on public.cards;
drop policy if exists "auth users create own cards" on public.cards;

-- Signed-in users can read/update/delete only cards they own.
create policy "owners read their cards"
  on public.cards for select
  to authenticated
  using (owner_id = auth.uid());

create policy "owners update their cards"
  on public.cards for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "owners delete their cards"
  on public.cards for delete
  to authenticated
  using (owner_id = auth.uid());

-- Signed-in users can create cards, but only owned by themselves.
create policy "auth users create own cards"
  on public.cards for insert
  to authenticated
  with check (owner_id = auth.uid());

-- Let owners read the contributors + recipients of cards they own (for the
-- account dashboard). Contributors already allow anon SELECT (realtime);
-- recipients were anon-deny, so add an owner-scoped read here.
drop policy if exists "owners read their recipients" on public.recipients;
create policy "owners read their recipients"
  on public.recipients for select
  to authenticated
  using (
    exists (
      select 1 from public.cards c
      where c.id = recipients.card_id and c.owner_id = auth.uid()
    )
  );
