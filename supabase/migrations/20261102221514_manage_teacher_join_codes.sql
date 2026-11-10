CREATE OR REPLACE FUNCTION public.admin_rotate_teacher_join_code(p_teacher_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $function$
DECLARE
  current_user_id uuid;
  current_user_role text;
  target_teacher_role text;
  plain_code text;
BEGIN
  current_user_id := auth.uid();

  SELECT role
  INTO current_user_role
  FROM public.profiles
  WHERE id = current_user_id
  FOR SHARE;

  SELECT role
  INTO target_teacher_role
  FROM public.profiles
  WHERE id = p_teacher_id
  FOR UPDATE;

  IF current_user_id IS NULL
     OR current_user_role IS DISTINCT FROM 'admin'
     OR target_teacher_role IS DISTINCT FROM 'teacher' THEN
    RAISE EXCEPTION 'Unable to manage teacher join code'
      USING ERRCODE = '42501';
  END IF;

  plain_code := pg_catalog.encode(extensions.gen_random_bytes(18), 'hex');

  UPDATE public.profiles
  SET teacher_join_code_hash = extensions.crypt(
    plain_code,
    extensions.gen_salt('bf', 12)
  )
  WHERE id = p_teacher_id
    AND role = 'teacher';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unable to manage teacher join code'
      USING ERRCODE = '42501';
  END IF;

  RETURN plain_code;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_revoke_teacher_join_code(p_teacher_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $function$
DECLARE
  current_user_id uuid;
  current_user_role text;
  target_teacher_role text;
BEGIN
  current_user_id := auth.uid();

  SELECT role
  INTO current_user_role
  FROM public.profiles
  WHERE id = current_user_id
  FOR SHARE;

  SELECT role
  INTO target_teacher_role
  FROM public.profiles
  WHERE id = p_teacher_id
  FOR UPDATE;

  IF current_user_id IS NULL
     OR current_user_role IS DISTINCT FROM 'admin'
     OR target_teacher_role IS DISTINCT FROM 'teacher' THEN
    RAISE EXCEPTION 'Unable to manage teacher join code'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET teacher_join_code_hash = NULL
  WHERE id = p_teacher_id
    AND role = 'teacher';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unable to manage teacher join code'
      USING ERRCODE = '42501';
  END IF;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_rotate_teacher_join_code(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_rotate_teacher_join_code(uuid)
  TO authenticated;

REVOKE ALL ON FUNCTION public.admin_revoke_teacher_join_code(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_teacher_join_code(uuid)
  TO authenticated;
