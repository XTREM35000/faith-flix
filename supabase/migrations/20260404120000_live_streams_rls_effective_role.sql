-- Aligne les politiques live_streams avec le rôle « effectif » (profil + JWT),
-- comme mergeEffectiveRole côté client : évite 42501 quand le JWT est à jour
-- mais profiles.role est encore membre / obsolète.
-- À appliquer après 20260403_fix_live_streams_admin_rls.sql (idempotent sur les noms de policies).

CREATE OR REPLACE FUNCTION public.is_live_stream_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN (
          'admin'::user_role,
          'super_admin'::user_role,
          'developer'::user_role
        )
    )
    OR lower(
      trim(
        COALESCE(
          auth.jwt() -> 'app_metadata' ->> 'role',
          auth.jwt() -> 'user_metadata' ->> 'role',
          ''
        )
      )
    ) IN ('admin', 'super_admin', 'developer');
$$;

ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "live_streams_insert_admin" ON public.live_streams;
DROP POLICY IF EXISTS "live_streams_update_admin" ON public.live_streams;
DROP POLICY IF EXISTS "live_streams_delete_admin" ON public.live_streams;

CREATE POLICY "live_streams_insert_admin"
  ON public.live_streams
  FOR INSERT
  WITH CHECK (public.is_live_stream_admin());

CREATE POLICY "live_streams_update_admin"
  ON public.live_streams
  FOR UPDATE
  USING (public.is_live_stream_admin())
  WITH CHECK (public.is_live_stream_admin());

CREATE POLICY "live_streams_delete_admin"
  ON public.live_streams
  FOR DELETE
  USING (public.is_live_stream_admin());
