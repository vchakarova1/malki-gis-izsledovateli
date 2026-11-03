ALTER TABLE public.profiles
  ADD COLUMN teacher_id uuid,
  ADD COLUMN teacher_join_code_hash text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_teacher_id_fkey
  FOREIGN KEY (teacher_id)
  REFERENCES public.profiles(id)
  ON DELETE RESTRICT;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_teacher_id_not_self
  CHECK (teacher_id IS NULL OR teacher_id <> id),
  ADD CONSTRAINT profiles_teacher_join_hash_check
  CHECK (
    teacher_join_code_hash IS NULL
    OR (
      role = 'teacher'
      AND pg_catalog.btrim(teacher_join_code_hash) <> ''
    )
  );

CREATE INDEX profiles_teacher_id_idx
  ON public.profiles (teacher_id);

CREATE OR REPLACE FUNCTION public.validate_profile_teacher_link()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
DECLARE
  linked_teacher_role text;
  linked_student_exists boolean;
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.role = 'teacher'
     AND NEW.role IS DISTINCT FROM 'teacher' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE teacher_id = NEW.id
    )
    INTO linked_student_exists;

    IF linked_student_exists THEN
      RAISE EXCEPTION 'Teacher role cannot be removed while students are linked';
    END IF;
  END IF;

  IF NEW.teacher_id IS NOT NULL THEN
    IF NEW.role <> 'student' THEN
      RAISE EXCEPTION 'Only student profiles can be linked to a teacher';
    END IF;

    SELECT role
    INTO linked_teacher_role
    FROM public.profiles
    WHERE id = NEW.teacher_id;

    IF linked_teacher_role IS DISTINCT FROM 'teacher' THEN
      RAISE EXCEPTION 'teacher_id must reference a teacher profile';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER profiles_validate_teacher_link
BEFORE INSERT OR UPDATE OF teacher_id, role
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_profile_teacher_link();

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
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL
     OR p_join_code IS NULL
     OR pg_catalog.btrim(p_join_code) = '' THEN
    RAISE EXCEPTION 'Unable to join teacher'
      USING ERRCODE = '42501';
  END IF;

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
      AND extensions.crypt(p_join_code, teacher_join_code_hash)
          = teacher_join_code_hash
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

REVOKE SELECT ON TABLE public.profiles FROM authenticated;
GRANT SELECT (id, created_at, role)
  ON TABLE public.profiles
  TO authenticated;

REVOKE ALL ON FUNCTION public.validate_profile_teacher_link()
  FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.join_teacher(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.join_teacher(text)
  TO authenticated;
