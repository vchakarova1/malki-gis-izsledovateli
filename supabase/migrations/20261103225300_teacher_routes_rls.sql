CREATE SCHEMA private
  AUTHORIZATION postgres;

REVOKE ALL ON SCHEMA private
  FROM PUBLIC, anon, authenticated, service_role;

GRANT USAGE ON SCHEMA private
  TO authenticated;

CREATE FUNCTION private.teacher_can_view_route(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS student_profile
    WHERE student_profile.id = p_student_id
      AND student_profile.role = 'student'
      AND student_profile.teacher_id = (SELECT auth.uid())
      AND EXISTS (
        SELECT 1
        FROM public.profiles AS teacher_profile
        WHERE teacher_profile.id = (SELECT auth.uid())
          AND teacher_profile.role = 'teacher'
      )
  );
$function$;

ALTER FUNCTION private.teacher_can_view_route(uuid)
  OWNER TO postgres;

REVOKE ALL ON FUNCTION private.teacher_can_view_route(uuid)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION private.teacher_can_view_route(uuid)
  TO authenticated;

CREATE POLICY "Teachers can view connected students routes"
ON public.routes
FOR SELECT
TO authenticated
USING (
  (SELECT private.teacher_can_view_route(routes.student_id))
);
