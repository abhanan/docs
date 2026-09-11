-- ===========================================================================
-- Digital Greeting Cards — schema, indexes, and RLS
-- ===========================================================================
-- Run this in the Supabase SQL editor (or via the Supabase CLI) once you have
-- created the project.
--
-- Security model for v1 (no auth accounts):
--   * All privileged writes go through Next.js API routes using the SERVICE
--     ROLE key, which bypasses RLS. Those routes validate the caller's token
--     (creator_token / contributor_token / recipient access_token) in code.
--   * The browser only ever uses the ANON key, and only to power the live
--     Realtime wall. RLS below grants anon just enough SELECT for that, keyed
--     on the (unguessable, random UUID) card_id, and blocks enumeration and
--     all anon writes.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- --------------------------------------------------------------------------
-- Enums
-- --------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'card_status') then
    create type card_status as enum ('draft', 'open', 'closed', 'expired');
  end if;
end$$;

-- --------------------------------------------------------------------------
-- cards
-- --------------------------------------------------------------------------
create table if not exists public.cards (
  id                  uuid primary key default gen_random_uuid(),
  occasion            text not null,
  theme_id            text not null default 'classic',
  title               text,                       -- e.g. "Happy Birthday, Sam!"
  recipient_label     text,                       -- display name of who it's for
  creator_id          text,                       -- anon session id for v1
  creator_token       text not null unique default encode(gen_random_bytes(24), 'hex'),
  contributor_token   text not null unique default encode(gen_random_bytes(24), 'hex'),
  status              card_status not null default 'open',
  created_at          timestamptz not null default now(),
  first_viewed_at     timestamptz,                -- set once, by first recipient
  fallback_expires_at timestamptz not null default (now() + interval '6 months')
);

comment on column public.cards.first_viewed_at is
  'Set once by whichever recipient opens first. Starts the 90-day expiry clock.';
comment on column public.cards.fallback_expires_at is
  'created_at + 6 months. Expires cards that are never opened.';

-- --------------------------------------------------------------------------
-- contributors
-- --------------------------------------------------------------------------
create table if not exists public.contributors (
  id         uuid primary key default gen_random_uuid(),
  card_id    uuid not null references public.cards(id) on delete cascade,
  name       text not null,
  message    text not null,
  photo_url  text,                                -- points to file in R2, not bytes
  photo_key  text,                                -- R2 object key, for deletion
  created_at timestamptz not null default now()
);

create index if not exists contributors_card_id_idx
  on public.contributors (card_id, created_at);

-- --------------------------------------------------------------------------
-- recipients
-- --------------------------------------------------------------------------
create table if not exists public.recipients (
  id           uuid primary key default gen_random_uuid(),
  card_id      uuid not null references public.cards(id) on delete cascade,
  name         text not null,
  access_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  viewed_at    timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists recipients_card_id_idx on public.recipients (card_id);
create index if not exists recipients_access_token_idx on public.recipients (access_token);

-- --------------------------------------------------------------------------
-- First-view transaction helper
-- --------------------------------------------------------------------------
-- Marks a recipient as viewed and, atomically, stamps the card's
-- first_viewed_at if this is the first ever view. Called by the server (view
-- API route) via RPC using the service role. Returns the resulting card row's
-- expiry-relevant fields.
create or replace function public.record_recipient_view(p_recipient_id uuid)
returns table (
  card_id         uuid,
  first_viewed_at timestamptz,
  status          card_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card_id uuid;
begin
  update public.recipients
     set viewed_at = coalesce(viewed_at, now())
   where id = p_recipient_id
   returning recipients.card_id into v_card_id;

  if v_card_id is null then
    raise exception 'recipient not found';
  end if;

  update public.cards c
     set first_viewed_at = coalesce(c.first_viewed_at, now())
   where c.id = v_card_id;

  return query
    select c.id, c.first_viewed_at, c.status
      from public.cards c
     where c.id = v_card_id;
end;
$$;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.cards        enable row level security;
alter table public.contributors enable row level security;
alter table public.recipients   enable row level security;

-- Clean slate on re-run.
drop policy if exists "anon reads contributors for realtime" on public.contributors;
drop policy if exists "no anon read cards"                   on public.cards;
drop policy if exists "no anon read recipients"              on public.recipients;

-- Contributors: anon may SELECT (required so the browser's Realtime channel
-- can stream the wall). card_id is a random UUID, so this does not permit
-- enumeration of other cards. No anon INSERT/UPDATE/DELETE — those are done
-- server-side with the service role after token validation.
create policy "anon reads contributors for realtime"
  on public.contributors
  for select
  to anon
  using (true);

-- Cards & recipients: no anon access at all. Everything the browser needs from
-- these tables is fetched through server API routes (service role) that first
-- validate the URL token. (Service role bypasses RLS, so these tables still
-- work server-side; anon is simply denied.)
-- (No policies created for anon => default deny.)

-- Realtime: add contributors to the realtime publication so postgres_changes
-- fire to subscribed clients.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.contributors;
    exception when duplicate_object then
      -- already in publication
      null;
    end;
  end if;
end$$;
