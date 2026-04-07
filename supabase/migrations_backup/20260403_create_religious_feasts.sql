-- Religious feasts feature (VIE SPIRITUELLE)

CREATE TABLE IF NOT EXISTS public.religious_feasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  feast_type VARCHAR(50) CHECK (feast_type IN ('fixed', 'movable')),
  liturgy_color VARCHAR(50),
  gospel_reference VARCHAR(100),
  homily_id UUID REFERENCES public.homilies(id) NULL,
  prayer_text TEXT NULL,
  reflection_text TEXT NULL,
  image_url TEXT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feast_prayer_intentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feast_id UUID REFERENCES public.religious_feasts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  intention TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_religious_feasts_date ON public.religious_feasts(date);
CREATE INDEX IF NOT EXISTS idx_religious_feasts_active_date ON public.religious_feasts(is_active, date);
CREATE INDEX IF NOT EXISTS idx_feast_prayer_intentions_feast_id ON public.feast_prayer_intentions(feast_id);

ALTER TABLE public.religious_feasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feast_prayer_intentions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "religious_feasts_select_public" ON public.religious_feasts;
CREATE POLICY "religious_feasts_select_public"
  ON public.religious_feasts
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "religious_feasts_manage_admin" ON public.religious_feasts;
CREATE POLICY "religious_feasts_manage_admin"
  ON public.religious_feasts
  FOR ALL
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

DROP POLICY IF EXISTS "feast_intentions_select_scoped" ON public.feast_prayer_intentions;
CREATE POLICY "feast_intentions_select_scoped"
  ON public.feast_prayer_intentions
  FOR SELECT
  USING (
    is_public = true
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'developer')
    )
  );

DROP POLICY IF EXISTS "feast_intentions_insert_own" ON public.feast_prayer_intentions;
CREATE POLICY "feast_intentions_insert_own"
  ON public.feast_prayer_intentions
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "feast_intentions_update_owner_or_admin" ON public.feast_prayer_intentions;
CREATE POLICY "feast_intentions_update_owner_or_admin"
  ON public.feast_prayer_intentions
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'developer')
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'developer')
    )
  );

DROP POLICY IF EXISTS "feast_intentions_delete_owner_or_admin" ON public.feast_prayer_intentions;
CREATE POLICY "feast_intentions_delete_owner_or_admin"
  ON public.feast_prayer_intentions
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'developer')
    )
  );

CREATE OR REPLACE FUNCTION public.update_religious_feasts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS religious_feasts_updated_at_trigger ON public.religious_feasts;
CREATE TRIGGER religious_feasts_updated_at_trigger
  BEFORE UPDATE ON public.religious_feasts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_religious_feasts_updated_at();
