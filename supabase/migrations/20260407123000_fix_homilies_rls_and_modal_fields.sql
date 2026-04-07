-- Homilies RLS + schema support for richer homily modal.

-- 1) Ensure categories table exists
CREATE TABLE IF NOT EXISTS public.homilies_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.homilies_categories ENABLE ROW LEVEL SECURITY;

-- 2) Ensure homilies table has fields required by the new modal
ALTER TABLE public.homilies
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.homilies_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_label TEXT,
  ADD COLUMN IF NOT EXISTS officiant_id UUID REFERENCES public.officiants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS video_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_storage_path TEXT;

ALTER TABLE public.homilies ENABLE ROW LEVEL SECURITY;

-- 3) Rebuild RLS policies for homilies
DROP POLICY IF EXISTS "Admins can CRUD homilies" ON public.homilies;
DROP POLICY IF EXISTS "Anyone can view homilies" ON public.homilies;
DROP POLICY IF EXISTS "homilies public read" ON public.homilies;
DROP POLICY IF EXISTS "homilies admin insert" ON public.homilies;
DROP POLICY IF EXISTS "homilies admin update" ON public.homilies;
DROP POLICY IF EXISTS "homilies admin delete" ON public.homilies;

CREATE POLICY "homilies public read"
  ON public.homilies
  FOR SELECT
  USING (true);

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
        AND lower(coalesce(p.role, '')) IN ('admin', 'super_admin', 'moderator', 'developer')
    )
  );

CREATE POLICY "homilies admin update"
  ON public.homilies
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

CREATE POLICY "homilies admin delete"
  ON public.homilies
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

-- 4) RLS for categories table
DROP POLICY IF EXISTS "homilies_categories public read" ON public.homilies_categories;
DROP POLICY IF EXISTS "homilies_categories admin insert" ON public.homilies_categories;
DROP POLICY IF EXISTS "homilies_categories admin update" ON public.homilies_categories;
DROP POLICY IF EXISTS "homilies_categories admin delete" ON public.homilies_categories;

CREATE POLICY "homilies_categories public read"
  ON public.homilies_categories
  FOR SELECT
  USING (true);

CREATE POLICY "homilies_categories admin insert"
  ON public.homilies_categories
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

CREATE POLICY "homilies_categories admin update"
  ON public.homilies_categories
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

CREATE POLICY "homilies_categories admin delete"
  ON public.homilies_categories
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

-- 5) Seed common categories
INSERT INTO public.homilies_categories (name, slug)
VALUES
  ('Dimanche', 'dimanche'),
  ('Fete', 'fete'),
  ('Careme', 'careme'),
  ('Avent', 'avent'),
  ('Mariage', 'mariage'),
  ('Funerailles', 'funerailles')
ON CONFLICT (name) DO NOTHING;

