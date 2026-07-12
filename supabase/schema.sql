-- Blessing blog schema
-- Run in the Supabase SQL editor

create extension if not exists "pgcrypto";

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default 'Untitled',
  content text not null default '',
  excerpt text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  font_preference text not null default 'merriweather'
    check (font_preference in ('merriweather', 'typewriter')),
  category text check (category is null or category in ('thoughts', 'books', 'notes', 'yaps')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- If upgrading an existing DB, also run:
-- alter table public.posts add column if not exists category text;
-- alter table public.posts drop constraint if exists posts_category_check;
-- alter table public.posts add constraint posts_category_check
--   check (category is null or category in ('thoughts', 'books', 'notes', 'yaps'));

create index if not exists posts_status_published_at_idx
  on public.posts (status, published_at desc);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  confirmed boolean not null default true
);

alter table public.posts enable row level security;
alter table public.subscribers enable row level security;

-- Public can read published posts
create policy "Public read published posts"
  on public.posts for select
  using (status = 'published' or auth.role() = 'authenticated');

-- Authenticated writer can insert/update/delete
create policy "Writer insert posts"
  on public.posts for insert
  to authenticated
  with check (true);

create policy "Writer update posts"
  on public.posts for update
  to authenticated
  using (true)
  with check (true);

create policy "Writer delete posts"
  on public.posts for delete
  to authenticated
  using (true);

-- Anyone can subscribe
create policy "Anyone can subscribe"
  on public.subscribers for insert
  to anon, authenticated
  with check (true);

-- Only authenticated can read subscribers
create policy "Writer read subscribers"
  on public.subscribers for select
  to authenticated
  using (true);
