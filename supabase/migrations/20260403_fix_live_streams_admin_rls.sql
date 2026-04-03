-- Fix RLS for live_streams admin operations
-- Previous policies only allowed profiles.role = 'admin', which blocks
-- super_admin / developer accounts from creating or editing streams.

ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "live_streams_insert_admin" ON public.live_streams;
DROP POLICY IF EXISTS "live_streams_update_admin" ON public.live_streams;
DROP POLICY IF EXISTS "live_streams_delete_admin" ON public.live_streams;

CREATE POLICY "live_streams_insert_admin"
  ON public.live_streams
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'developer')
    )
  );

CREATE POLICY "live_streams_update_admin"
  ON public.live_streams
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'developer')
    )
  );

CREATE POLICY "live_streams_delete_admin"
  ON public.live_streams
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'developer')
    )
  );
