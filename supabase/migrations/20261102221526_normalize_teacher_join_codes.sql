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
  alphabet CONSTANT text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  canonical_code text := '';
  random_byte integer;
  accepted_limit CONSTANT integer := 256 - (256 % 32);
  position_index integer;
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

  FOR position_index IN 1..10 LOOP
    LOOP
      random_byte := pg_catalog.get_byte(
        extensions.gen_random_bytes(1),
        0
      );

      EXIT WHEN random_byte < accepted_limit;
    END LOOP;

    canonical_code := canonical_code
      || pg_catalog.substr(
        alphabet,
        (random_byte % 32) + 1,
        1
      );
  END LOOP;

  UPDATE public.profiles
  SET teacher_join_code_hash = extensions.crypt(
    canonical_code,
    extensions.gen_salt('bf', 12)
  )
  WHERE id = p_teacher_id
    AND role = 'teacher';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unable to manage teacher join code'
      USING ERRCODE = '42501';
  END IF;

  RETURN pg_catalog.substr(canonical_code, 1, 5)
    || '-'
    || pg_catalog.substr(canonical_code, 6, 5);
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

CREATE OR REPLACE FUNCTION public.join_teacher(p_join_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $function$
DECLARE
  current_user_id uuid;
  current_role text;
  current_teacher_id uuid;
  matched_teacher_id uuid;
  candidate_teacher_id uuid;
  matched_teacher_count integer := 0;
  canonical_code text;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL
     OR p_join_code IS NULL THEN
    RAISE EXCEPTION 'Unable to join teacher'
      USING ERRCODE = '42501';
  END IF;

  canonical_code := pg_catalog.upper(pg_catalog.btrim(p_join_code));

  IF canonical_code !~ '^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}-?[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}$' THEN
    RAISE EXCEPTION 'Unable to join teacher'
      USING ERRCODE = '42501';
  END IF;

  canonical_code := pg_catalog.replace(canonical_code, '-', '');

  SELECT role, teacher_id
  INTO current_role, current_teacher_id
  FROM public.profiles
  WHERE id = current_user_id
  FOR UPDATE;

  IF current_role IS DISTINCT FROM 'student'
     OR current_teacher_id IS NOT NULL THEN
    RAISE EXCEPTION 'Unable to join teacher'
      USING ERRCODE = '42501';
  END IF;

  FOR candidate_teacher_id IN
    SELECT id
    FROM public.profiles
    WHERE role = 'teacher'
      AND teacher_join_code_hash IS NOT NULL
      AND extensions.crypt(
        canonical_code,
        teacher_join_code_hash
      ) = teacher_join_code_hash
    FOR UPDATE
  LOOP
    matched_teacher_count := matched_teacher_count + 1;
    matched_teacher_id := candidate_teacher_id;
  END LOOP;

  IF matched_teacher_count <> 1
     OR matched_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Unable to join teacher'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET teacher_id = matched_teacher_id
  WHERE id = current_user_id
    AND role = 'student'
    AND teacher_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unable to join teacher'
      USING ERRCODE = '42501';
  END IF;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_rotate_teacher_join_code(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_rotate_teacher_join_code(uuid)
  TO authenticated, postgres, service_role;

REVOKE ALL ON FUNCTION public.admin_revoke_teacher_join_code(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_teacher_join_code(uuid)
  TO authenticated, postgres, service_role;

REVOKE ALL ON FUNCTION public.join_teacher(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.join_teacher(text)
  TO authenticated, postgres, service_role;
