CREATE TABLE public.routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (btrim(title) <> ''),
  selected_stops jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(selected_stops) = 'array'),
  annotation text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'reviewed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX routes_student_id_idx ON public.routes (student_id);

CREATE OR REPLACE FUNCTION public.set_routes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER routes_set_updated_at
BEFORE UPDATE ON public.routes
FOR EACH ROW
EXECUTE FUNCTION public.set_routes_updated_at();

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.routes FROM anon;
REVOKE ALL ON TABLE public.routes FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.routes TO authenticated;

CREATE POLICY "Students can view own routes"
ON public.routes
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = student_id);

CREATE POLICY "Students can create own draft routes"
ON public.routes
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = student_id
  AND status = 'draft'
);

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
);

COMMENT ON TABLE public.routes IS
'Ученически маршрути и техните статуси. Учителските проверки се съхраняват отделно в teacher_reviews.';
