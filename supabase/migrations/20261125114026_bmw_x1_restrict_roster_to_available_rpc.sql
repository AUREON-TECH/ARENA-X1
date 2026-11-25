-- Restrict direct roster reads to the least-privilege signup RPC.
-- The Arena client uses bmw_x1_available_roster() for both signup and
-- post-confirmation enrollment; no shipped client file reads bmw_x1_roster
-- directly. The SECURITY DEFINER RPC is owned by postgres and returns only
-- professionals without a pending or approved account.

REVOKE SELECT ON TABLE public.bmw_x1_roster FROM anon, authenticated;

DROP POLICY IF EXISTS bmw_roster_public_signup_read ON public.bmw_x1_roster;
DROP POLICY IF EXISTS bmw_roster_read ON public.bmw_x1_roster;
