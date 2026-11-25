-- Remove legacy body CHECK constraints that are logically implied by the stricter 1..50 non-whitespace checks.
-- No data, users, messages, ranking values, or scores are modified.
ALTER TABLE public.bmw_x1_posts
  DROP CONSTRAINT IF EXISTS bmw_x1_posts_body_check;
ALTER TABLE public.bmw_x1_comments
  DROP CONSTRAINT IF EXISTS bmw_x1_comments_body_check;
ALTER TABLE public.bmw_x1_result_comments
  DROP CONSTRAINT IF EXISTS bmw_x1_result_comments_body_check;
