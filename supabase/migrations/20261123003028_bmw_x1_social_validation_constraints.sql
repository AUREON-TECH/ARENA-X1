-- Enforce the Arena's existing 50-code-point and emoji rules at the database boundary.
-- Existing production rows were checked before applying; no rows or scores were changed.

ALTER TABLE public.bmw_x1_posts
  ADD CONSTRAINT bmw_x1_posts_body_1_50_ck
  CHECK (char_length(body) BETWEEN 1 AND 50 AND body ~ '[^[:space:]]') NOT VALID;
ALTER TABLE public.bmw_x1_posts VALIDATE CONSTRAINT bmw_x1_posts_body_1_50_ck;

ALTER TABLE public.bmw_x1_posts
  ADD CONSTRAINT bmw_x1_posts_category_ck
  CHECK (category IN ('torcida','desafio','parabens','meta','gestao')) NOT VALID;
ALTER TABLE public.bmw_x1_posts VALIDATE CONSTRAINT bmw_x1_posts_category_ck;

ALTER TABLE public.bmw_x1_comments
  ADD CONSTRAINT bmw_x1_comments_body_1_50_ck
  CHECK (char_length(body) BETWEEN 1 AND 50 AND body ~ '[^[:space:]]') NOT VALID;
ALTER TABLE public.bmw_x1_comments VALIDATE CONSTRAINT bmw_x1_comments_body_1_50_ck;

ALTER TABLE public.bmw_x1_result_comments
  ADD CONSTRAINT bmw_x1_result_comments_body_1_50_ck
  CHECK (char_length(body) BETWEEN 1 AND 50 AND body ~ '[^[:space:]]') NOT VALID;
ALTER TABLE public.bmw_x1_result_comments VALIDATE CONSTRAINT bmw_x1_result_comments_body_1_50_ck;

ALTER TABLE public.bmw_x1_reactions
  ADD CONSTRAINT bmw_x1_reactions_emoji_ck
  CHECK (emoji IN ('🔥','👏','💪','😂','👀','🏆')) NOT VALID;
ALTER TABLE public.bmw_x1_reactions VALIDATE CONSTRAINT bmw_x1_reactions_emoji_ck;

ALTER TABLE public.bmw_x1_members
  ADD CONSTRAINT bmw_x1_members_status_ck
  CHECK (status IN ('pending','approved','rejected')) NOT VALID;
ALTER TABLE public.bmw_x1_members VALIDATE CONSTRAINT bmw_x1_members_status_ck;

ALTER TABLE public.bmw_x1_roster
  ADD CONSTRAINT bmw_x1_roster_role_ck
  CHECK (role IN ('CAPTADOR','CONSULTOR','CLOSER')) NOT VALID;
ALTER TABLE public.bmw_x1_roster VALIDATE CONSTRAINT bmw_x1_roster_role_ck;
