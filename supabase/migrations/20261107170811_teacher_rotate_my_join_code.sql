-- Allow an authenticated teacher to rotate only their own student join code.
-- The plaintext code is returned once; only its bcrypt hash is stored.
CREATE FUNCTION public.teacher_rotate_my_join_code()
RETURNS pg_catalog.text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_user_id pg_catalog.uuid;
  current_user_role pg_catalog.text;
  alphabet CONSTANT pg_catalog.text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  canonical_code pg_catalog.text := '';
  random_byte pg_catalog.int4;
  accepted_limit CONSTANT pg_catalog.int4 := 256 - (256 % 32);
  position_index pg_catalog.int4;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Unable to manage teacher join code'
      USING ERRCODE = '42501';
  END IF;

  SELECT teacher_profile.role
  INTO current_user_role
  FROM public.profiles AS teacher_profile
  WHERE teacher_profile.id = current_user_id
  FOR UPDATE;

  IF current_user_role IS DISTINCT FROM 'teacher' THEN
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

  UPDATE public.profiles AS teacher_profile
  SET teacher_join_code_hash = extensions.crypt(
    canonical_code,
    extensions.gen_salt('bf', 12)
  )
  WHERE teacher_profile.id = current_user_id
    AND teacher_profile.role = 'teacher';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unable to manage teacher join code'
      USING ERRCODE = '42501';
  END IF;

  RETURN pg_catalog.substr(canonical_code, 1, 5)
    || '-'
    || pg_catalog.substr(canonical_code, 6, 5);
END;
$function$;

ALTER FUNCTION public.teacher_rotate_my_join_code()
  OWNER TO postgres;

REVOKE ALL ON FUNCTION public.teacher_rotate_my_join_code()
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.teacher_rotate_my_join_code()
  TO authenticated;
