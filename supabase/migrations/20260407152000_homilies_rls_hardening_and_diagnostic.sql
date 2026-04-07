-- Hardening RLS for homilies + diagnostic helper.

ALTER TABLE public.homilies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "homilies public read" ON public.homilies;
DROP POLICY IF EXISTS "homilies admin insert" ON public.homilies;
DROP POLICY IF EXISTS "homilies admin update" ON public.homilies;
DROP POLICY IF EXISTS "homilies admin delete" ON public.homilies;

-- Public read for listing pages.
CREATE POLICY "homilies public read"
  ON public.homilies
  FOR SELECT
  USING (true);

-- Admin-like roles can insert/update/delete.
-- Include legacy french role label "administrateur" for compatibility.
CREATE POLICY "homilies admin insert"
  ON public.homilies
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(coalesce(p.role, '')) IN ('admin', 'super_admin', 'moderator', 'developer', 'administrateur')
    )
  );

CREATE POLICY "homilies admin update"
  ON public.homilies
  FOR UPDATE
  TO public
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(coalesce(p.role, '')) IN ('admin', 'super_admin', 'moderator', 'developer', 'administrateur')
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(coalesce(p.role, '')) IN ('admin', 'super_admin', 'moderator', 'developer', 'administrateur')
    )
  );

CREATE POLICY "homilies admin delete"
  ON public.homilies
  FOR DELETE
  TO public
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(coalesce(p.role, '')) IN ('admin', 'super_admin', 'moderator', 'developer', 'administrateur')
    )
  );

-- Diagnostic helper RPC to inspect access conditions quickly.
CREATE OR REPLACE FUNCTION public.debug_homily_access(p_homily_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_row_exists boolean;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
  SELECT EXISTS(SELECT 1 FROM public.homilies h WHERE h.id = p_homily_id) INTO v_row_exists;

  RETURN jsonb_build_object(
    'auth_uid', v_uid,
    'profile_role', v_role,
    'row_exists', v_row_exists,
    'role_allowed', lower(coalesce(v_role, '')) IN ('admin', 'super_admin', 'moderator', 'developer', 'administrateur')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.debug_homily_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.debug_homily_access(uuid) TO authenticated;

