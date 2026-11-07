DO $migration$
DECLARE
  existing_bucket_is_public boolean;
  existing_bucket_name text;
  existing_bucket_file_size_limit bigint;
  existing_bucket_mime_types text[];
  policy_name text;
BEGIN
  SELECT
    bucket.name,
    bucket.public,
    bucket.file_size_limit,
    bucket.allowed_mime_types
  INTO
    existing_bucket_name,
    existing_bucket_is_public,
    existing_bucket_file_size_limit,
    existing_bucket_mime_types
  FROM storage.buckets AS bucket
  WHERE bucket.id = 'publication-materials';

  IF FOUND THEN
    IF existing_bucket_name IS DISTINCT FROM 'publication-materials'
       OR existing_bucket_is_public IS DISTINCT FROM false
       OR existing_bucket_file_size_limit IS DISTINCT FROM 52428800
       OR existing_bucket_mime_types IS DISTINCT FROM ARRAY[
         'application/pdf',
         'image/png',
         'image/jpeg',
         'image/webp'
       ]::text[] THEN
      RAISE EXCEPTION
        'Existing publication-materials bucket has an incompatible configuration';
    END IF;
  ELSE
    INSERT INTO storage.buckets (
      id,
      name,
      public,
      file_size_limit,
      allowed_mime_types
    )
    VALUES (
      'publication-materials',
      'publication-materials',
      false,
      52428800,
      ARRAY[
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/webp'
      ]::text[]
    );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS function_definition
    JOIN pg_catalog.pg_namespace AS function_schema
      ON function_schema.oid = function_definition.pronamespace
    WHERE function_schema.nspname = 'private'
      AND function_definition.proname =
        'storage_object_is_approved_publication'
      AND pg_catalog.pg_get_function_identity_arguments(
        function_definition.oid
      ) = 'text'
  ) THEN
    RAISE EXCEPTION
      'Storage helper function already exists: private.storage_object_is_approved_publication(text)';
  END IF;

  FOREACH policy_name IN ARRAY ARRAY[
    'Publication owners and admins can upload materials',
    'Anyone can read approved publication materials',
    'Publication owners and admins can read materials',
    'Publication owners and admins can update proposed materials',
    'Publication owners and admins can delete unapproved materials'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = policy_name
    ) THEN
      RAISE EXCEPTION
        'Storage policy already exists and was not changed: %',
        policy_name;
    END IF;
  END LOOP;
END;
$migration$;

CREATE FUNCTION private.storage_object_is_approved_publication(
  p_object_name text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT p_object_name IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.publications AS publication
      WHERE publication.status = 'approved'
        AND publication.storage_path = p_object_name
    );
$function$;

ALTER FUNCTION private.storage_object_is_approved_publication(text)
OWNER TO postgres;

REVOKE ALL ON FUNCTION private.storage_object_is_approved_publication(text)
FROM PUBLIC, anon, authenticated, service_role;

GRANT USAGE ON SCHEMA private
TO anon;

GRANT EXECUTE ON FUNCTION private.storage_object_is_approved_publication(text)
TO anon;

CREATE POLICY "Publication owners and admins can upload materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  storage.objects.bucket_id = 'publication-materials'
  AND storage.objects.name <> ''
  AND EXISTS (
    SELECT 1
    FROM public.publications AS publication
    WHERE storage.objects.name LIKE publication.id::text || '/%'
      AND publication.status = 'proposed'
      AND (
        publication.proposed_by = (SELECT auth.uid())
        OR private.current_user_is_role('admin')
      )
  )
);

CREATE POLICY "Anyone can read approved publication materials"
ON storage.objects
FOR SELECT
TO anon
USING (
  storage.objects.bucket_id = 'publication-materials'
  AND private.storage_object_is_approved_publication(
    storage.objects.name
  )
);

CREATE POLICY "Publication owners and admins can read materials"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  storage.objects.bucket_id = 'publication-materials'
  AND EXISTS (
    SELECT 1
    FROM public.publications AS publication
    WHERE (
      (
        publication.status = 'approved'
        AND publication.storage_path = storage.objects.name
      )
      OR (
        publication.status IN ('proposed', 'rejected')
        AND storage.objects.name LIKE publication.id::text || '/%'
        AND private.current_user_is_role('admin')
      )
      OR (
        publication.status = 'proposed'
        AND publication.storage_path = storage.objects.name
        AND publication.proposed_by = (SELECT auth.uid())
      )
    )
  )
);

CREATE POLICY "Publication owners and admins can update proposed materials"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  storage.objects.bucket_id = 'publication-materials'
  AND EXISTS (
    SELECT 1
    FROM public.publications AS publication
    WHERE publication.status = 'proposed'
      AND publication.storage_path = storage.objects.name
      AND (
        publication.proposed_by = (SELECT auth.uid())
        OR private.current_user_is_role('admin')
      )
  )
)
WITH CHECK (
  storage.objects.bucket_id = 'publication-materials'
  AND EXISTS (
    SELECT 1
    FROM public.publications AS publication
    WHERE publication.status = 'proposed'
      AND publication.storage_path = storage.objects.name
      AND (
        publication.proposed_by = (SELECT auth.uid())
        OR private.current_user_is_role('admin')
      )
  )
);

CREATE POLICY "Publication owners and admins can delete unapproved materials"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  storage.objects.bucket_id = 'publication-materials'
  AND EXISTS (
    SELECT 1
    FROM public.publications AS publication
    WHERE storage.objects.name LIKE publication.id::text || '/%'
      AND (
        (
          publication.status = 'proposed'
          AND publication.proposed_by = (SELECT auth.uid())
        )
        OR (
          publication.status IN ('proposed', 'rejected')
          AND private.current_user_is_role('admin')
        )
      )
  )
);
