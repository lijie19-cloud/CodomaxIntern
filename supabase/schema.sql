-- Run in the Supabase SQL Editor to create/update the BlogSpace posts table.
-- Passwords and user identities are managed by Supabase Auth, not a public table.

create table if not exists public.blog_posts (
  id text primary key default gen_random_uuid()::text,
  title text not null check (char_length(title) between 1 and 100),
  category text not null check (category in ('Design', 'Lifestyle', 'Technology', 'Travel', 'Personal Growth', 'Other')),
  excerpt text not null default '' check (char_length(excerpt) <= 180),
  content text not null check (char_length(content) between 20 and 100000),
  author text not null,
  author_email text not null default '',
  author_image text not null default '',
  author_id uuid,
  date date not null default current_date,
  status text not null default 'published' check (status in ('published', 'draft')),
  image text not null default '' check (char_length(image) <= 2000),
  created_at timestamptz not null default now()
);

-- Upgrade an existing basic posts table (for example one with only id/title/content).
alter table public.blog_posts
  add column if not exists category text not null default 'Other',
  add column if not exists excerpt text not null default '',
  add column if not exists author text not null default 'Community Writer',
  add column if not exists author_email text not null default '',
  add column if not exists author_image text not null default '',
  add column if not exists author_id uuid,
  add column if not exists date date not null default current_date,
  add column if not exists status text not null default 'published',
  add column if not exists image text not null default '';

update public.blog_posts
set category = 'Other'
where category not in ('Design', 'Lifestyle', 'Technology', 'Travel', 'Personal Growth', 'Other');
update public.blog_posts
set status = 'published'
where status not in ('published', 'draft');

-- Migrate the former custom-user foreign key, if the older schema was installed.
alter table public.blog_posts drop constraint if exists blog_posts_author_id_fkey;
update public.blog_posts
set author_id = null
where author_id is not null
  and not exists (select 1 from auth.users where auth.users.id = blog_posts.author_id);
alter table public.blog_posts
  add constraint blog_posts_author_id_fkey
  foreign key (author_id) references auth.users(id) on delete set null;

alter table public.blog_posts drop constraint if exists blog_posts_category_check;
alter table public.blog_posts
  add constraint blog_posts_category_check
  check (category in ('Design', 'Lifestyle', 'Technology', 'Travel', 'Personal Growth', 'Other'));
alter table public.blog_posts drop constraint if exists blog_posts_status_check;
alter table public.blog_posts
  add constraint blog_posts_status_check
  check (status in ('published', 'draft'));

create index if not exists blog_posts_public_date_idx
  on public.blog_posts (status, date desc);
create index if not exists blog_posts_author_date_idx
  on public.blog_posts (author_id, date desc);

create table if not exists public.blog_likes (
  post_id text not null references public.blog_posts(id) on delete cascade,
  -- The Express API verifies the signed app JWT before writes. Do not tie
  -- legacy app sessions to auth.users, where their ID may not exist.
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_id text not null references public.blog_posts(id) on delete cascade,
  user_id uuid not null,
  author text not null,
  author_image text not null default '',
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- Upgrade tables created by the first social-features migration. App JWTs are
-- verified by Express and must also work for users created before Supabase Auth.
alter table public.blog_likes
  drop constraint if exists blog_likes_user_id_fkey;
alter table public.blog_comments
  drop constraint if exists blog_comments_user_id_fkey;

create index if not exists blog_comments_post_date_idx
  on public.blog_comments (post_id, created_at asc);

-- Images are uploaded by the API using the server-only Supabase key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-images', 'blog-images', true, 3145728, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.blog_posts enable row level security;
revoke all on table public.blog_posts from anon, authenticated;
grant select, insert, update, delete on table public.blog_posts to service_role;
alter table public.blog_likes enable row level security;
alter table public.blog_comments enable row level security;
revoke all on table public.blog_likes from anon, authenticated;
revoke all on table public.blog_comments from anon, authenticated;
grant select, insert, delete on table public.blog_likes to service_role;
grant select, insert, delete on table public.blog_comments to service_role;
drop policy if exists "Public can view blog images" on storage.objects;
create policy "Public can view blog images" on storage.objects
  for select to public using (bucket_id = 'blog-images');

-- Lock down the old credential table if an earlier schema created it.
do $$
begin
  if to_regclass('public.blog_users') is not null then
    execute 'alter table public.blog_users enable row level security';
    execute 'revoke all on table public.blog_users from anon, authenticated';
  end if;
end $$;

insert into public.blog_posts
  (title, category, excerpt, content, author, date, status, image)
select seed.title, seed.category, seed.excerpt, seed.content, seed.author,
       seed.date::date, seed.status, seed.image
from (values
  ('The Art of Slowing Down', 'Lifestyle', 'Finding small moments of calm in a world that never stops moving.', 'Sometimes the best way to move forward is to pause. A slower morning, a walk without a destination, or a few minutes with a book can help us notice what matters.', 'Maya Johnson', '2026-10-18', 'published', 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80'),
  ('Designing for People, Not Pixels', 'Design', 'Good design starts with empathy, curiosity, and a willingness to listen.', 'The most memorable designs are not just beautiful. They make a task clearer, a moment easier, or a person feel understood.', 'Daniel Kim', '2026-10-15', 'published', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80'),
  ('Small Habits, Meaningful Change', 'Personal Growth', 'Big transformations often begin with tiny promises we keep to ourselves.', 'A habit does not have to be dramatic to matter. Five minutes of reading, a short walk, or writing one paragraph can become the foundation for something bigger.', 'Sara Ali', '2026-10-12', 'published', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80'),
  ('What Learning to Code Taught Me', 'Technology', 'Beyond syntax and screens, programming taught me how to approach problems.', 'Learning to code is a practice in patience. Every bug is a question, every fix a lesson, and every small project a reason to keep going.', 'Noah Williams', '2026-10-09', 'published', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUiIs91RjgsQKsXk_iEUeYLqxUdJHCGAEuUaVTye8dOQ&s=10'),
  ('A Weekend Away from the Noise', 'Travel', 'Sometimes a change of scenery is all it takes to see things differently.', 'A new place invites us to look again. You notice the light, the sounds, the people, and the little details that routine can make invisible.', 'Alex Morgan', '2026-10-06', 'published', 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80')
) as seed(title, category, excerpt, content, author, date, status, image)
where not exists (
  select 1 from public.blog_posts existing
  where existing.title = seed.title and existing.author = seed.author
);

notify pgrst, 'reload schema';
