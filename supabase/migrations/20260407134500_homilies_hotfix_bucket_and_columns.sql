-- Hotfix idempotent: ensure homilies bucket + expected columns exist.

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('homilies', 'homilies', true)
ON CONFLICT (id) DO NOTHING;

-- Optional schema extensions (safe if already applied)
ALTER TABLE public.homilies
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.homilies_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_label TEXT,
  ADD COLUMN IF NOT EXISTS officiant_id UUID REFERENCES public.officiants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS video_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_storage_path TEXT;

-- NOTE:
-- Folders in Supabase storage are virtual. They are created automatically
-- when files are uploaded under:
--   homilies/videos/...
--   homilies/thumbnails/...

