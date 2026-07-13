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

-- Gallery image metadata (used with Supabase Storage bucket "media")
create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  url text not null,
  created_at timestamptz not null default now()
);

alter table public.gallery_images enable row level security;

create policy "Public read gallery images"
  on public.gallery_images for select
  using (true);

create policy "Service role manages gallery images"
  on public.gallery_images for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Storage bucket for voice notes + gallery images
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read media" on storage.objects;
drop policy if exists "Service role write media" on storage.objects;
drop policy if exists "Service role update media" on storage.objects;
drop policy if exists "Service role delete media" on storage.objects;

create policy "Public read media"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "Service role write media"
  on storage.objects for insert
  to service_role
  with check (bucket_id = 'media');

create policy "Service role update media"
  on storage.objects for update
  to service_role
  using (bucket_id = 'media')
  with check (bucket_id = 'media');

create policy "Service role delete media"
  on storage.objects for delete
  to service_role
  using (bucket_id = 'media');
