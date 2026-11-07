-- Return only the UUIDs of students linked to the authenticated teacher.
-- The caller cannot provide a teacher ID or inspect another teacher's students.
CREATE FUNCTION public.get_my_connected_students()
RETURNS TABLE (student_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT student_profile.id AS student_id
  FROM public.profiles AS student_profile
  WHERE student_profile.role = 'student'
    AND student_profile.teacher_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS current_profile
      WHERE current_profile.id = (SELECT auth.uid())
        AND current_profile.role = 'teacher'
    );
$function$;

ALTER FUNCTION public.get_my_connected_students()
  OWNER TO postgres;

REVOKE ALL ON FUNCTION public.get_my_connected_students()
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_my_connected_students()
  TO authenticated;
