CREATE OR REPLACE FUNCTION public.student_has_teacher()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT COALESCE(
    (
      SELECT profile.teacher_id IS NOT NULL
      FROM public.profiles AS profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.role = 'student'
    ),
    false
  );
$function$;

ALTER FUNCTION public.student_has_teacher()
  OWNER TO postgres;

REVOKE ALL ON FUNCTION public.student_has_teacher()
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.student_has_teacher()
  TO authenticated;
