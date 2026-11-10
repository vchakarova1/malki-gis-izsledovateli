ALTER TABLE public.publications
  ADD COLUMN section_key text,
  ADD CONSTRAINT publications_section_key_check
    CHECK (
      section_key IS NULL
      OR section_key IN ('missions', 'challenges', 'projects', 'discoveries')
    );

COMMENT ON COLUMN public.publications.section_key IS
  'The thematic public laboratory section for this student publication.';

-- The approved_publications view uses security_invoker, so anon also needs
-- column-level SELECT on the newly exposed column. Existing RLS still limits
-- visible rows to approved publications.
GRANT SELECT (section_key)
ON TABLE public.publications
TO anon;

-- Replace the old RPC signature with one that requires a valid section.
DROP FUNCTION public.edit_publication(
  uuid, text, text, jsonb, text, text, text
);

CREATE FUNCTION public.edit_publication(
  p_publication_id uuid,
  p_public_title text,
  p_public_description text,
  p_public_stops jsonb,
  p_section_key text,
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

  IF p_section_key IS NULL
     OR p_section_key NOT IN (
       'missions',
       'challenges',
       'projects',
       'discoveries'
     ) THEN
    RAISE EXCEPTION 'Invalid publication section'
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
      section_key = p_section_key,
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

ALTER FUNCTION public.edit_publication(
  uuid, text, text, jsonb, text, text, text, text
) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.edit_publication(
  uuid, text, text, jsonb, text, text, text, text
)
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.edit_publication(
  uuid, text, text, jsonb, text, text, text, text
)
TO authenticated;

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
    AND section_key IS NOT NULL
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

ALTER FUNCTION public.approve_publication(uuid) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.approve_publication(uuid)
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.approve_publication(uuid)
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
  approved_at,
  section_key
FROM public.publications
WHERE status = 'approved';

REVOKE ALL ON public.approved_publications
FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT ON public.approved_publications
TO anon, authenticated;
