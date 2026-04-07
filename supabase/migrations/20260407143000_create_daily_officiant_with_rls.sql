-- Create daily_officiant table used by /admin/officiants.

CREATE TABLE IF NOT EXISTS public.daily_officiant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paroisse_id UUID NOT NULL REFERENCES public.paroisses(id) ON DELETE CASCADE,
  officiant_id UUID NULL REFERENCES public.officiants(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT daily_officiant_unique_per_day UNIQUE (paroisse_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_officiant_paroisse_date
  ON public.daily_officiant (paroisse_id, date);

CREATE INDEX IF NOT EXISTS idx_daily_officiant_officiant
  ON public.daily_officiant (officiant_id);

ALTER TABLE public.daily_officiant ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_officiant public read" ON public.daily_officiant;
DROP POLICY IF EXISTS "daily_officiant admin insert" ON public.daily_officiant;
DROP POLICY IF EXISTS "daily_officiant admin update" ON public.daily_officiant;
DROP POLICY IF EXISTS "daily_officiant admin delete" ON public.daily_officiant;

-- Public read (used by public forms/pages)
CREATE POLICY "daily_officiant public read"
  ON public.daily_officiant
  FOR SELECT
  USING (true);

-- Admin-like roles can manage rows
CREATE POLICY "daily_officiant admin insert"
  ON public.daily_officiant
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(coalesce(p.role, '')) IN ('admin', 'super_admin', 'moderator', 'developer')
    )
  );

CREATE POLICY "daily_officiant admin update"
  ON public.daily_officiant
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(coalesce(p.role, '')) IN ('admin', 'super_admin', 'moderator', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(coalesce(p.role, '')) IN ('admin', 'super_admin', 'moderator', 'developer')
    )
  );

CREATE POLICY "daily_officiant admin delete"
  ON public.daily_officiant
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(coalesce(p.role, '')) IN ('admin', 'super_admin', 'moderator', 'developer')
    )
  );

