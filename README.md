# Blessing

A slick, simple personal blog — diary, thoughts, and yaps. Inspired by write.as, branded **Blessing**.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- TipTap editor
- Supabase (optional) for Postgres + Auth — or local JSON + password for development
- Merriweather / IBM Plex Mono (typewriter, write mode only) fonts, light & dark mode

## Quick start (local)

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Writer login:** [/login](http://localhost:3000/login) (not linked in the public nav)
- **Default local password:** `blessing` (set `WRITER_PASSWORD` in `.env.local`)
- **Write:** [/write](http://localhost:3000/write)

Without Supabase credentials, posts and subscribers are stored in `data/*.json`.

## Supabase (production)

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.
3. Create an Auth user (email/password) for yourself.
4. Set in `.env.local` / Vercel:

```
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Contact form email

Messages go to `CONTACT_TO_EMAIL` (server-only — never shown on the site).

1. Create a free [Resend](https://resend.com) account and API key.
2. Set `RESEND_API_KEY` in `.env.local` / Vercel.
3. Until then, submissions are saved to `data/contact-messages.json` in local mode.

When Supabase URL/key vars are set, the app uses Supabase Auth + database instead of local mode.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Home feed |
| `/posts/[slug]` | Post |
| `/who-am-i` | About |
| `/contact` | Contact |
| `/subscribe` | Email capture |
| `/login` | Hidden writer login |
| `/write` | New post |
| `/write/[id]` | Edit post |

## Phase 2 (not in MVP)

Voice uploads + transcripts, email digests on publish, anonymous comments.
