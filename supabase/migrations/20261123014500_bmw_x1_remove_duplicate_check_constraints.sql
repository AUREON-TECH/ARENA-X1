-- Remove only redundant CHECK constraints introduced by the previous migration.
-- The original constraints remain in place with identical definitions.
-- Keep the stricter 1..50 non-whitespace checks for social text.

ALTER TABLE public.bmw_x1_posts
  DROP CONSTRAINT IF EXISTS bmw_x1_posts_category_ck;

ALTER TABLE public.bmw_x1_members
  DROP CONSTRAINT IF EXISTS bmw_x1_members_status_ck;

ALTER TABLE public.bmw_x1_reactions
  DROP CONSTRAINT IF EXISTS bmw_x1_reactions_emoji_ck;

ALTER TABLE public.bmw_x1_roster
  DROP CONSTRAINT IF EXISTS bmw_x1_roster_role_ck;
