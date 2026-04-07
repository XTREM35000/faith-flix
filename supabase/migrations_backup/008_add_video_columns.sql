-- Ajouter les colonnes manquantes à la table videos
ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;

-- Ajouter des commentaires
COMMENT ON COLUMN public.videos.category IS 'Catégorie de la vidéo (Sermon, Musique, Célébration, Enseignement, Témoignage)';
COMMENT ON COLUMN public.videos.published IS 'Statut de publication de la vidéo';
