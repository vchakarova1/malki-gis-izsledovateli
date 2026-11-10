CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (btrim(title) <> ''),
  instructions text NOT NULL DEFAULT '',
  worksheet_template jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(worksheet_template) = 'object'),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT assignments_published_at_check
    CHECK (status <> 'published' OR published_at IS NOT NULL),
  CONSTRAINT assignments_draft_published_at_check
    CHECK (status <> 'draft' OR published_at IS NULL)
);

CREATE INDEX assignments_teacher_id_idx
  ON public.assignments (teacher_id);

CREATE INDEX assignments_status_idx
  ON public.assignments (status);

CREATE TABLE public.assignment_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL
    REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assignment_recipients_assignment_student_key
    UNIQUE (assignment_id, student_id)
);

CREATE INDEX assignment_recipients_assignment_id_idx
  ON public.assignment_recipients (assignment_id);

CREATE INDEX assignment_recipients_student_id_idx
  ON public.assignment_recipients (student_id);

ALTER TABLE public.routes
  ADD COLUMN assignment_id uuid
    REFERENCES public.assignments(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX routes_student_assignment_unique_idx
  ON public.routes (student_id, assignment_id)
  WHERE assignment_id IS NOT NULL;

CREATE INDEX routes_assignment_id_idx
  ON public.routes (assignment_id);

CREATE TABLE public.teacher_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL
    REFERENCES public.routes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  achievement_level text NOT NULL
    CHECK (achievement_level IN ('beginning', 'developing', 'achieved', 'excellent')),
  feedback text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teacher_reviews_route_key UNIQUE (route_id)
);

CREATE INDEX teacher_reviews_teacher_id_idx
  ON public.teacher_reviews (teacher_id);

CREATE TABLE public.publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL
    REFERENCES public.routes(id) ON DELETE RESTRICT,
  proposed_by uuid NOT NULL
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reviewed_by uuid
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'approved', 'rejected')),
  public_title text NOT NULL CHECK (btrim(public_title) <> ''),
  public_description text NOT NULL DEFAULT '',
  public_stops jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(public_stops) = 'array'),
  public_annotation text NOT NULL DEFAULT '',
  storage_path text,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  CONSTRAINT publications_route_key UNIQUE (route_id),
  CONSTRAINT publications_approved_at_check
    CHECK (status <> 'approved' OR approved_at IS NOT NULL),
  CONSTRAINT publications_unapproved_at_check
    CHECK (status = 'approved' OR approved_at IS NULL)
);

CREATE INDEX publications_status_idx
  ON public.publications (status);

CREATE INDEX publications_proposed_by_idx
  ON public.publications (proposed_by);

CREATE OR REPLACE FUNCTION public.set_learning_cycle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER assignments_set_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.set_learning_cycle_updated_at();

CREATE TRIGGER teacher_reviews_set_updated_at
BEFORE UPDATE ON public.teacher_reviews
FOR EACH ROW
EXECUTE FUNCTION public.set_learning_cycle_updated_at();

CREATE TRIGGER publications_set_updated_at
BEFORE UPDATE ON public.publications
FOR EACH ROW
EXECUTE FUNCTION public.set_learning_cycle_updated_at();

CREATE OR REPLACE FUNCTION public.protect_route_ownership()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NEW.student_id IS DISTINCT FROM OLD.student_id
     OR NEW.assignment_id IS DISTINCT FROM OLD.assignment_id THEN
    RAISE EXCEPTION 'Route ownership and assignment cannot be changed';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER routes_protect_ownership
BEFORE UPDATE ON public.routes
FOR EACH ROW
EXECUTE FUNCTION public.protect_route_ownership();

CREATE OR REPLACE FUNCTION private.current_user_is_role(p_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = p_role
  );
$function$;

CREATE OR REPLACE FUNCTION private.current_user_owns_assignment(p_assignment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.assignments
    WHERE id = p_assignment_id
      AND teacher_id = (SELECT auth.uid())
      AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
          AND role = 'teacher'
      )
  );
$function$;

CREATE OR REPLACE FUNCTION private.current_user_is_assignment_recipient(
  p_assignment_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.assignment_recipients
    WHERE assignment_id = p_assignment_id
      AND student_id = (SELECT auth.uid())
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'student'
  );
$function$;

CREATE OR REPLACE FUNCTION private.current_user_is_student(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT p_student_id IS NOT NULL
    AND p_student_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = p_student_id
        AND role = 'student'
    );
$function$;

CREATE OR REPLACE FUNCTION private.assignment_recipient_is_valid(
  p_assignment_id uuid,
  p_student_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.assignments AS assignment
    JOIN public.profiles AS student_profile
      ON student_profile.id = p_student_id
    WHERE assignment.id = p_assignment_id
      AND assignment.teacher_id = (SELECT auth.uid())
      AND assignment.status = 'draft'
      AND student_profile.role = 'student'
      AND student_profile.teacher_id = assignment.teacher_id
  );
$function$;

CREATE OR REPLACE FUNCTION private.current_user_can_work_on_assignment(
  p_assignment_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.assignments AS assignment
    JOIN public.assignment_recipients AS recipient
      ON recipient.assignment_id = assignment.id
     AND recipient.student_id = (SELECT auth.uid())
    JOIN public.profiles AS student_profile
      ON student_profile.id = recipient.student_id
    WHERE assignment.id = p_assignment_id
      AND assignment.status = 'published'
      AND student_profile.role = 'student'
      AND student_profile.teacher_id = assignment.teacher_id
  );
$function$;

CREATE OR REPLACE FUNCTION private.current_user_can_review_route(p_route_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.routes AS route
    WHERE route.id = p_route_id
      AND private.teacher_can_view_route(route.student_id)
  );
$function$;

CREATE OR REPLACE FUNCTION private.current_user_can_view_publication(
  p_publication_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.publications AS publication
    JOIN public.routes AS route ON route.id = publication.route_id
    WHERE publication.id = p_publication_id
      AND (
        publication.proposed_by = (SELECT auth.uid())
        OR private.current_user_can_review_route(route.id)
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public.create_assignment_route(
  p_assignment_id uuid,
  p_title text,
  p_selected_stops jsonb,
  p_annotation text DEFAULT ''
)
RETURNS public.routes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_user_id uuid;
  result_route public.routes;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL
     OR NOT private.current_user_is_role('student') THEN
    RAISE EXCEPTION 'Only students can create assignment routes'
      USING ERRCODE = '42501';
  END IF;

  IF p_assignment_id IS NULL
     OR p_title IS NULL
     OR pg_catalog.btrim(p_title) = ''
     OR p_selected_stops IS NULL
     OR pg_catalog.jsonb_typeof(p_selected_stops) <> 'array' THEN
    RAISE EXCEPTION 'Invalid assignment route'
      USING ERRCODE = '22023';
  END IF;

  IF NOT private.current_user_can_work_on_assignment(p_assignment_id) THEN
    RAISE EXCEPTION 'Student is not an assignment recipient'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.routes (
    student_id,
    assignment_id,
    title,
    selected_stops,
    annotation,
    status
  )
  VALUES (
    current_user_id,
    p_assignment_id,
    pg_catalog.btrim(p_title),
    p_selected_stops,
    COALESCE(p_annotation, ''),
    'draft'
  )
  RETURNING * INTO result_route;

  RETURN result_route;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Student already has a route for this assignment'
      USING ERRCODE = '23505';
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_assignment_recipient(
  p_assignment_id uuid,
  p_student_id uuid
)
RETURNS public.assignment_recipients
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  locked_assignment public.assignments;
  result_recipient public.assignment_recipients;
BEGIN
  IF auth.uid() IS NULL
     OR NOT private.current_user_is_role('teacher') THEN
    RAISE EXCEPTION 'Only teachers can add recipients'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO locked_assignment
  FROM public.assignments
  WHERE id = p_assignment_id
    AND teacher_id = auth.uid()
    AND status = 'draft'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment is not an editable draft'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_student_id
      AND role = 'student'
      AND teacher_id = locked_assignment.teacher_id
  ) THEN
    RAISE EXCEPTION 'Student is not connected to the assignment teacher'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.assignment_recipients (
    assignment_id,
    student_id
  )
  VALUES (
    p_assignment_id,
    p_student_id
  )
  RETURNING * INTO result_recipient;

  RETURN result_recipient;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Student is already an assignment recipient'
      USING ERRCODE = '23505';
END;
$function$;

CREATE OR REPLACE FUNCTION public.remove_assignment_recipient(
  p_assignment_id uuid,
  p_student_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  locked_assignment public.assignments;
BEGIN
  IF auth.uid() IS NULL
     OR NOT private.current_user_is_role('teacher') THEN
    RAISE EXCEPTION 'Only teachers can remove recipients'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO locked_assignment
  FROM public.assignments
  WHERE id = p_assignment_id
    AND teacher_id = auth.uid()
    AND status = 'draft'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment is not an editable draft'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.assignment_recipients
  WHERE assignment_id = p_assignment_id
    AND student_id = p_student_id;

  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.publish_assignment(p_assignment_id uuid)
RETURNS public.assignments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  locked_assignment public.assignments;
  result_assignment public.assignments;
BEGIN
  IF auth.uid() IS NULL
     OR NOT private.current_user_is_role('teacher')
  THEN
    RAISE EXCEPTION 'Only teachers can publish assignments'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO locked_assignment
  FROM public.assignments
  WHERE id = p_assignment_id
    AND teacher_id = auth.uid()
    AND status = 'draft'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment is not an editable draft'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.assignment_recipients
    WHERE assignment_id = p_assignment_id
  ) THEN
    RAISE EXCEPTION 'Assignment must have at least one recipient'
      USING ERRCODE = '23514';
  END IF;

  UPDATE public.assignments
  SET status = 'published',
      published_at = now()
  WHERE id = p_assignment_id
    AND status = 'draft'
  RETURNING * INTO result_assignment;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment is not a draft'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN result_assignment;
END;
$function$;

CREATE OR REPLACE FUNCTION public.edit_publication(
  p_publication_id uuid,
  p_public_title text,
  p_public_description text,
  p_public_stops jsonb,
  p_public_annotation text DEFAULT '',
  p_storage_path_action text DEFAULT 'keep',
  p_storage_path text DEFAULT NULL
)
RETURNS public.publications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  result_publication public.publications;
BEGIN
  IF auth.uid() IS NULL
     OR NOT private.current_user_is_role('admin') THEN
    RAISE EXCEPTION 'Only administrators can edit publications'
      USING ERRCODE = '42501';
  END IF;

  IF p_public_title IS NULL
     OR pg_catalog.btrim(p_public_title) = ''
     OR p_public_description IS NULL
     OR pg_catalog.btrim(p_public_description) = ''
     OR p_public_stops IS NULL
     OR pg_catalog.jsonb_typeof(p_public_stops) <> 'array' THEN
    RAISE EXCEPTION 'Invalid public publication data'
      USING ERRCODE = '22023';
  END IF;

  IF p_storage_path_action IS NULL
     OR p_storage_path_action NOT IN ('keep', 'set', 'clear') THEN
    RAISE EXCEPTION 'Invalid storage path action'
      USING ERRCODE = '22023';
  END IF;

  IF p_storage_path_action = 'set'
     AND (
       p_storage_path IS NULL
       OR pg_catalog.btrim(p_storage_path) = ''
     ) THEN
    RAISE EXCEPTION 'Storage path is required when setting a path'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.publications
  SET public_title = pg_catalog.btrim(p_public_title),
      public_description = pg_catalog.btrim(p_public_description),
      public_stops = p_public_stops,
      public_annotation = COALESCE(p_public_annotation, ''),
      storage_path = CASE p_storage_path_action
        WHEN 'keep' THEN storage_path
        WHEN 'set' THEN pg_catalog.btrim(p_storage_path)
        WHEN 'clear' THEN NULL
      END
  WHERE id = p_publication_id
    AND status = 'proposed'
  RETURNING * INTO result_publication;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only proposed publications can be edited'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN result_publication;
END;
$function$;

CREATE OR REPLACE FUNCTION public.teacher_review_route(
  p_route_id uuid,
  p_achievement_level text,
  p_feedback text DEFAULT ''
)
RETURNS public.teacher_reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  result_review public.teacher_reviews;
  route_status text;
  route_student_id uuid;
BEGIN
  IF auth.uid() IS NULL
     OR NOT private.current_user_is_role('teacher') THEN
    RAISE EXCEPTION 'Only teachers can review routes'
      USING ERRCODE = '42501';
  END IF;

  IF p_achievement_level IS NULL
     OR p_achievement_level NOT IN (
       'beginning',
       'developing',
       'achieved',
       'excellent'
     ) THEN
    RAISE EXCEPTION 'Invalid achievement level'
      USING ERRCODE = '22023';
  END IF;

  SELECT status, student_id
  INTO route_status, route_student_id
  FROM public.routes
  WHERE id = p_route_id
  FOR UPDATE;

  IF NOT FOUND
     OR route_status <> 'submitted'
     OR NOT private.teacher_can_view_route(route_student_id) THEN
    RAISE EXCEPTION 'Route cannot be reviewed by this teacher'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.teacher_reviews (
    route_id,
    teacher_id,
    achievement_level,
    feedback
  )
  VALUES (
    p_route_id,
    auth.uid(),
    p_achievement_level,
    COALESCE(p_feedback, '')
  )
  RETURNING * INTO result_review;

  UPDATE public.routes
  SET status = 'reviewed'
  WHERE id = p_route_id
    AND status = 'submitted';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Route status changed before review completed'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN result_review;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Route already has a teacher review'
      USING ERRCODE = '23505';
END;
$function$;

CREATE OR REPLACE FUNCTION public.propose_publication(
  p_route_id uuid,
  p_public_title text,
  p_public_description text
)
RETURNS public.publications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  source_route public.routes;
  result_publication public.publications;
BEGIN
  IF auth.uid() IS NULL
     OR NOT private.current_user_is_role('teacher') THEN
    RAISE EXCEPTION 'Only teachers can propose publications'
      USING ERRCODE = '42501';
  END IF;

  IF p_public_title IS NULL
     OR pg_catalog.btrim(p_public_title) = ''
     OR p_public_description IS NULL
     OR pg_catalog.btrim(p_public_description) = '' THEN
    RAISE EXCEPTION 'Public title and description are required'
      USING ERRCODE = '22023';
  END IF;

  SELECT route.*
  INTO source_route
  FROM public.routes AS route
  WHERE route.id = p_route_id
    AND route.status = 'reviewed'
    AND private.teacher_can_view_route(route.student_id)
    AND EXISTS (
      SELECT 1
      FROM public.teacher_reviews AS review
      WHERE review.route_id = route.id
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Route is not eligible for publication'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.publications (
    route_id,
    proposed_by,
    public_title,
    public_description,
    public_stops,
    public_annotation,
    status
  )
  VALUES (
    source_route.id,
    auth.uid(),
    pg_catalog.btrim(p_public_title),
    pg_catalog.btrim(p_public_description),
    source_route.selected_stops,
    source_route.annotation,
    'proposed'
  )
  RETURNING * INTO result_publication;

  RETURN result_publication;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Route already has a publication'
      USING ERRCODE = '23505';
END;
$function$;

CREATE OR REPLACE FUNCTION public.approve_publication(p_publication_id uuid)
RETURNS public.publications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  result_publication public.publications;
BEGIN
  IF auth.uid() IS NULL
     OR NOT private.current_user_is_role('admin') THEN
    RAISE EXCEPTION 'Only administrators can approve publications'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.publications
  SET status = 'approved',
      reviewed_by = auth.uid(),
      approved_at = now()
  WHERE id = p_publication_id
    AND status = 'proposed'
    AND pg_catalog.btrim(public_title) <> ''
    AND pg_catalog.btrim(public_description) <> ''
  RETURNING * INTO result_publication;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Publication is not ready for approval'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN result_publication;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reject_publication(
  p_publication_id uuid,
  p_admin_note text DEFAULT ''
)
RETURNS public.publications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  result_publication public.publications;
BEGIN
  IF auth.uid() IS NULL
     OR NOT private.current_user_is_role('admin') THEN
    RAISE EXCEPTION 'Only administrators can reject publications'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.publications
  SET status = 'rejected',
      reviewed_by = auth.uid(),
      admin_note = COALESCE(p_admin_note, '')
  WHERE id = p_publication_id
    AND status = 'proposed'
  RETURNING * INTO result_publication;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Publication is not awaiting review'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN result_publication;
END;
$function$;

ALTER FUNCTION private.current_user_is_role(text) OWNER TO postgres;
ALTER FUNCTION private.current_user_owns_assignment(uuid) OWNER TO postgres;
ALTER FUNCTION private.current_user_is_assignment_recipient(uuid) OWNER TO postgres;
ALTER FUNCTION private.current_user_is_student(uuid) OWNER TO postgres;
ALTER FUNCTION private.assignment_recipient_is_valid(uuid, uuid) OWNER TO postgres;
ALTER FUNCTION private.current_user_can_work_on_assignment(uuid) OWNER TO postgres;
ALTER FUNCTION private.current_user_can_review_route(uuid) OWNER TO postgres;
ALTER FUNCTION private.current_user_can_view_publication(uuid) OWNER TO postgres;
ALTER FUNCTION public.create_assignment_route(uuid, text, jsonb, text) OWNER TO postgres;
ALTER FUNCTION public.add_assignment_recipient(uuid, uuid) OWNER TO postgres;
ALTER FUNCTION public.remove_assignment_recipient(uuid, uuid) OWNER TO postgres;
ALTER FUNCTION public.publish_assignment(uuid) OWNER TO postgres;
ALTER FUNCTION public.edit_publication(uuid, text, text, jsonb, text, text, text) OWNER TO postgres;
ALTER FUNCTION public.teacher_review_route(uuid, text, text) OWNER TO postgres;
ALTER FUNCTION public.propose_publication(uuid, text, text) OWNER TO postgres;
ALTER FUNCTION public.approve_publication(uuid) OWNER TO postgres;
ALTER FUNCTION public.reject_publication(uuid, text) OWNER TO postgres;

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

DROP POLICY "Students can create own draft routes"
ON public.routes;

CREATE POLICY "Students can create own free draft routes"
ON public.routes
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = student_id
  AND status = 'draft'
  AND assignment_id IS NULL
);

DROP POLICY "Students can update own draft routes"
ON public.routes;

CREATE POLICY "Students can update own draft routes"
ON public.routes
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.uid()) = student_id
  AND status = 'draft'
)
WITH CHECK (
  (SELECT auth.uid()) = student_id
  AND status IN ('draft', 'submitted')
  AND (
    assignment_id IS NULL
    OR private.current_user_can_work_on_assignment(assignment_id)
  )
);

CREATE POLICY "Teachers can view own assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  private.current_user_owns_assignment(id)
);

CREATE POLICY "Students can view published assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  status = 'published'
  AND private.current_user_is_assignment_recipient(id)
);

CREATE POLICY "Teachers can create own assignments"
ON public.assignments
FOR INSERT
TO authenticated
WITH CHECK (
  teacher_id = (SELECT auth.uid())
  AND private.current_user_is_role('teacher')
  AND status = 'draft'
);

CREATE POLICY "Teachers can update own draft assignments"
ON public.assignments
FOR UPDATE
TO authenticated
USING (
  status = 'draft'
  AND private.current_user_owns_assignment(id)
)
WITH CHECK (
  status = 'draft'
  AND teacher_id = (SELECT auth.uid())
);

CREATE POLICY "Students can view own assignment recipients"
ON public.assignment_recipients
FOR SELECT
TO authenticated
USING (
  student_id = (SELECT auth.uid())
);

CREATE POLICY "Teachers can view own assignment recipients"
ON public.assignment_recipients
FOR SELECT
TO authenticated
USING (
  private.current_user_owns_assignment(assignment_id)
);

CREATE POLICY "Teachers can add recipients to draft assignments"
ON public.assignment_recipients
FOR INSERT
TO authenticated
WITH CHECK (
  private.current_user_owns_assignment(assignment_id)
  AND EXISTS (
    SELECT 1
    FROM public.assignments
    WHERE id = assignment_id
      AND status = 'draft'
  )
  AND private.assignment_recipient_is_valid(assignment_id, student_id)
);

CREATE POLICY "Teachers can remove recipients from draft assignments"
ON public.assignment_recipients
FOR DELETE
TO authenticated
USING (
  private.current_user_owns_assignment(assignment_id)
  AND EXISTS (
    SELECT 1
    FROM public.assignments
    WHERE id = assignment_id
      AND status = 'draft'
  )
);

CREATE POLICY "Students can view own teacher reviews"
ON public.teacher_reviews
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.routes
    WHERE id = route_id
      AND student_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Teachers can view connected student reviews"
ON public.teacher_reviews
FOR SELECT
TO authenticated
USING (
  private.current_user_can_review_route(route_id)
);

CREATE POLICY "Teachers can view own publication proposals"
ON public.publications
FOR SELECT
TO authenticated
USING (
  proposed_by = (SELECT auth.uid())
  OR private.current_user_can_view_publication(id)
);

CREATE POLICY "Admins can view all publications"
ON public.publications
FOR SELECT
TO authenticated
USING (
  private.current_user_is_role('admin')
);

CREATE POLICY "Anyone can view approved publications"
ON public.publications
FOR SELECT
TO anon, authenticated
USING (
  status = 'approved'
);

REVOKE ALL ON TABLE public.assignments FROM anon;
REVOKE ALL ON TABLE public.assignment_recipients FROM anon;
REVOKE ALL ON TABLE public.teacher_reviews FROM anon;
REVOKE ALL ON TABLE public.publications FROM anon;

REVOKE ALL ON TABLE public.assignments FROM authenticated;
REVOKE ALL ON TABLE public.assignment_recipients FROM authenticated;
REVOKE ALL ON TABLE public.teacher_reviews FROM authenticated;
REVOKE ALL ON TABLE public.publications FROM authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.assignments TO authenticated;
GRANT SELECT ON TABLE public.assignment_recipients TO authenticated;
GRANT SELECT ON TABLE public.teacher_reviews TO authenticated;
GRANT SELECT ON TABLE public.publications TO authenticated;

GRANT ALL ON TABLE public.assignments TO service_role;
GRANT ALL ON TABLE public.assignment_recipients TO service_role;
GRANT ALL ON TABLE public.teacher_reviews TO service_role;
GRANT ALL ON TABLE public.publications TO service_role;

REVOKE ALL ON FUNCTION public.set_learning_cycle_updated_at() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.protect_route_ownership() FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION private.current_user_is_role(text)
FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION private.current_user_owns_assignment(uuid)
FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION private.current_user_is_assignment_recipient(uuid)
FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION private.current_user_is_student(uuid)
FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION private.assignment_recipient_is_valid(uuid, uuid)
FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION private.current_user_can_work_on_assignment(uuid)
FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION private.current_user_can_review_route(uuid)
FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION private.current_user_can_view_publication(uuid)
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION private.current_user_is_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_user_owns_assignment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_user_is_assignment_recipient(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.assignment_recipient_is_valid(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_user_can_work_on_assignment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_user_can_review_route(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_user_can_view_publication(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.create_assignment_route(uuid, text, jsonb, text)
FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.add_assignment_recipient(uuid, uuid)
FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.remove_assignment_recipient(uuid, uuid)
FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.publish_assignment(uuid)
FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.edit_publication(uuid, text, text, jsonb, text, text, text)
FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.teacher_review_route(uuid, text, text)
FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.propose_publication(uuid, text, text)
FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.approve_publication(uuid)
FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.reject_publication(uuid, text)
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.create_assignment_route(uuid, text, jsonb, text)
TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_assignment_recipient(uuid, uuid)
TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_assignment_recipient(uuid, uuid)
TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_assignment(uuid)
TO authenticated;
GRANT EXECUTE ON FUNCTION public.edit_publication(uuid, text, text, jsonb, text, text, text)
TO authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_review_route(uuid, text, text)
TO authenticated;
GRANT EXECUTE ON FUNCTION public.propose_publication(uuid, text, text)
TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_publication(uuid)
TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_publication(uuid, text)
TO authenticated;

CREATE OR REPLACE VIEW public.approved_publications
WITH (security_invoker = true)
AS
SELECT
  id,
  public_title,
  public_description,
  public_stops,
  public_annotation,
  storage_path,
  approved_at
FROM public.publications
WHERE status = 'approved';

REVOKE ALL ON public.approved_publications
FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT ON public.approved_publications
TO anon, authenticated;

REVOKE ALL ON TABLE public.publications FROM anon;

GRANT SELECT (
  id,
  public_title,
  public_description,
  public_stops,
  public_annotation,
  storage_path,
  approved_at,
  status
)
ON TABLE public.publications
TO anon;

COMMENT ON TABLE public.assignments IS
'Индивидуални учителски задания и общ шаблон на работния лист.';

COMMENT ON TABLE public.assignment_recipients IS
'Индивидуалните ученици, получили конкретно задание.';

COMMENT ON TABLE public.teacher_reviews IS
'Един окончателен учителски преглед на предадена ученическа работа.';

COMMENT ON TABLE public.publications IS
'Отделна публична версия на ученическа работа, подлежаща на администраторско одобрение.';
