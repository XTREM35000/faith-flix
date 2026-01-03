-- Rendre video_url nullable pour supporter les vidéos locales uploadées
ALTER TABLE public.videos
ALTER COLUMN video_url DROP NOT NULL;

-- Ajouter une colonne video_storage_path pour stocker le chemin des vidéos uploadées localement
ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS video_storage_path TEXT;

-- Ajouter des commentaires
COMMENT ON COLUMN public.videos.video_url IS 'URL externe de la vidéo (YouTube, Vimeo, etc.) - peut être NULL si vidéo uploadée localement';
COMMENT ON COLUMN public.videos.video_storage_path IS 'Chemin de stockage interne pour les vidéos uploadées localement (dans le bucket videos)';

-- Créer un index sur video_storage_path pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_videos_storage_path ON public.videos(video_storage_path);
