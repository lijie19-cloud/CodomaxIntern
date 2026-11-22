-- Fix likes/comments for valid legacy BlogSpace sessions whose user UUID is
-- not present in Supabase Auth. The Express API verifies the signed app JWT
-- and is the only role allowed to write these tables.
alter table public.blog_likes
  drop constraint if exists blog_likes_user_id_fkey;

alter table public.blog_comments
  drop constraint if exists blog_comments_user_id_fkey;

notify pgrst, 'reload schema';
