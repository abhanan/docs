# Groupcard — Digital Group Greeting Cards

A web app for creating digital group greeting/wishing cards. A **creator** starts
a card, invites **contributors** (no login) to add messages/photos via a shared
link, then sends a **recipient link** (or several, for multi-recipient cards)
showing the finished "wall." The card expires **90 days after the first recipient
view** — with a 6-month fallback if it's never opened.

Built per Build Spec v1. All five milestones are implemented.

## Tech stack

| Concern            | Choice                                                    |
| ------------------ | -------------------------------------------------------- |
| Frontend           | Next.js 14 (App Router) + Tailwind CSS                   |
| Database + Realtime| Supabase (Postgres) — metadata, text, tokens only        |
| Photo storage      | Cloudflare R2 (S3-compatible, **zero egress**)          |
| Hosting            | Vercel                                                   |
| Expiry job         | Vercel Cron → daily API route                            |

**The database never stores photo bytes.** On upload, the browser gets a
presigned URL from `/api/upload` and `PUT`s the file **directly to R2**; only the
resulting URL (text) is saved in `contributors.photo_url`. On view, the browser
loads each image straight from R2 via `<img src>`. The DB is never in the
image-serving path — so repeat views don't rack up bandwidth cost.

## Milestone map

- **M1 — Data layer & card creation**: `supabase/migrations/0001_init.sql`
  (schema + RLS + first-view RPC), R2 upload helper
  (`src/lib/r2/storage.ts`, `/api/upload`), creator flow (`/create`,
  `/api/cards`), contributor link on the dashboard.
- **M2 — Contribute flow**: `/contribute/[cardId]/[token]`, client-side image
  compression (`src/lib/image.ts`), direct-to-R2 upload, live wall via Supabase
  Realtime (`src/components/Wall.tsx`), IP rate limiting
  (`src/lib/rate-limit.ts`).
- **M3 — Recipient flow + expiry**: multiple recipients per card
  (`/api/cards/[cardId]/recipients`), reveal/unwrap animation + countdown
  (`/view/[cardId]/[token]`, `src/components/Countdown.tsx`), shared first-view
  clock (`record_recipient_view` RPC), daily expiry job that deletes rows **and**
  R2 objects (`/api/cron/expire`).
- **M4 — Export**: PNG / multi-page PDF export of the finished wall
  (`src/components/ExportButton.tsx`) on both the creator and recipient views —
  the natural spot for a future paywall.
- **M5 — Polish**: theme/poster picker (`src/lib/themes.ts`,
  `src/components/ThemePicker.tsx`), creator moderation (delete a contribution +
  its R2 photo), empty/error/expired states, mobile-responsive throughout.

## Setup

### 1. Install

```bash
cd greeting-cards-app
npm install
cp .env.example .env.local   # then fill in the values below
```

### 2. Supabase

1. Create a project at supabase.com.
2. In the SQL editor, run `supabase/migrations/0001_init.sql`. It creates the
   `cards`, `contributors`, `recipients` tables, RLS policies, the first-view
   RPC, and adds `contributors` to the realtime publication.
3. Copy into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only — never exposed to the browser)

### 3. Cloudflare R2

1. Create an R2 bucket (e.g. `greeting-cards`).
2. Create an R2 API token (Access Key ID + Secret Access Key).
3. Enable public access on the bucket (r2.dev URL) or bind a custom domain, and
   set a CORS rule allowing `PUT` and `GET` from your app origin, e.g.:
   ```json
   [{ "AllowedOrigins": ["*"], "AllowedMethods": ["PUT", "GET"], "AllowedHeaders": ["*"] }]
   ```
4. Copy into `.env.local`: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
   `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, and
   `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` (the public bucket / custom-domain URL).

### 4. App + cron

- `NEXT_PUBLIC_APP_URL` — your deployed origin (used to build shareable links).
- `CRON_SECRET` — a long random string. `vercel.json` schedules
  `/api/cron/expire` daily at 03:00 UTC; Vercel Cron sends
  `Authorization: Bearer $CRON_SECRET` automatically. The route refuses to run
  without the secret, so it's never an open deletion endpoint.

### 5. Run

```bash
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

**The app runs without keys** — pages load and degrade gracefully, and API
routes return `503 not_configured` until Supabase/R2 env vars are set. Add the
keys when you have them; no code changes needed.

## Security model (v1, no auth accounts)

- Every privileged write goes through a Next.js API route using the Supabase
  **service-role** key, which validates the URL token (`creator_token`,
  `contributor_token`, or recipient `access_token`) in code before touching data.
- The browser only uses the **anon** key, and only to subscribe to the Realtime
  wall. RLS grants anon `SELECT` on `contributors` (needed for realtime) and
  denies everything else; `cards`/`recipients` are anon-deny. `card_id` is a
  random UUID, so this doesn't allow enumerating other cards.

## Links

- Contributor (shared): `/contribute/{card_id}/{contributor_token}`
- Recipient (personal): `/view/{card_id}/{access_token}`
- Creator (admin):      `/card/{card_id}/{creator_token}`

The creator's dashboard link is also remembered in `localStorage` (there are no
accounts in v1), so creators can return to it from the home page.

## Deferred (not v1)

Accounts/login, payments, notification emails, per-recipient independent expiry
clocks. See the build spec.

## Notes on dependencies

`npm audit` flags transitive packages that don't affect the running server:
`dompurify` (pulled in by `jspdf`, used only for client-side PDF export),
`glob` (via `eslint-config-next`, dev-only), and a broad `next`/`postcss`
advisory range — this app pins the patched `next@14.2.35`. Upgrading `jspdf`'s
`dompurify` requires a major bump; revisit when hardening for production.
