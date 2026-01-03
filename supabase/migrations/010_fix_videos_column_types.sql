-- Supprimer la contrainte de clé étrangère d'abord
ALTER TABLE public.videos
DROP CONSTRAINT IF EXISTS videos_category_id_fkey;

-- Maintenant convertir la colonne en TEXT
ALTER TABLE public.videos
ALTER COLUMN category TYPE TEXT USING category::text;

-- Ajouter video_url si absent
ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Ajouter des commentaires pour clarifier
COMMENT ON COLUMN public.videos.category IS 'Catégorie de la vidéo (Sermon, Musique, Célébration, Enseignement, Témoignage)';
COMMENT ON COLUMN public.videos.video_url IS 'URL de la vidéo (YouTube, Vimeo, etc.)';
