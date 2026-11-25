CREATE OR REPLACE FUNCTION public.bmw_x1_available_roster()
RETURNS TABLE(professional text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT r.professional, r.role
  FROM public.bmw_x1_roster AS r
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.bmw_x1_members AS m
    WHERE m.professional = r.professional
      AND m.status IN ('pending', 'approved')
  )
  ORDER BY r.professional ASC;
$function$;

REVOKE ALL ON FUNCTION public.bmw_x1_available_roster() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bmw_x1_available_roster() TO anon, authenticated;
