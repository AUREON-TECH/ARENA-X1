CREATE OR REPLACE FUNCTION bmw_auth.is_email_confirmation_provenance_valid()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = (SELECT auth.uid())
      AND u.email_confirmed_at IS NOT NULL
      AND (u.confirmation_sent_at IS NOT NULL OR u.invited_at IS NOT NULL)
      AND lower(u.email) = lower((SELECT auth.jwt() ->> 'email'))
  );
$function$;

REVOKE ALL ON FUNCTION bmw_auth.is_email_confirmation_provenance_valid() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION bmw_auth.is_email_confirmation_provenance_valid() TO authenticated;

DROP POLICY IF EXISTS bmw_member_request ON public.bmw_x1_members;
CREATE POLICY bmw_member_request
ON public.bmw_x1_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND status = 'pending'
  AND approved_by IS NULL
  AND approved_at IS NULL
  AND requester_email = lower((SELECT auth.jwt() ->> 'email'))
  AND bmw_auth.is_verified_email()
  AND bmw_auth.is_email_confirmation_provenance_valid()
);

COMMENT ON FUNCTION bmw_auth.is_email_confirmation_provenance_valid()
IS 'BMW X1: exige e-mail confirmado e evidência de envio por confirmação ou convite antes de criar solicitação de acesso.';
