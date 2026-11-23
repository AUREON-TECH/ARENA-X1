-- Mirrors the production migration recorded as 20261123123844.
-- A professional may have only one active request/account at a time.
-- Rejected requests remain eligible for a new request.
CREATE UNIQUE INDEX IF NOT EXISTS bmw_x1_one_active_account_per_professional
ON public.bmw_x1_members (professional)
WHERE status IN ('pending', 'approved');
