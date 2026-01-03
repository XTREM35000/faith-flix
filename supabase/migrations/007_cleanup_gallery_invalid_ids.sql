-- Migration: sauvegarde et suppression des enregistrements de gallery_images dont l'id n'est pas un UUID
BEGIN;

-- Crée une table de backup si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.gallery_images_invalid_backup (LIKE public.gallery_images INCLUDING ALL);

-- Insère les lignes invalides dans la table de backup (id non-UUID)
-- Insère les lignes invalides dans la table de backup (cast id en texte pour la comparaison)
INSERT INTO public.gallery_images_invalid_backup
SELECT * FROM public.gallery_images
WHERE id::text !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$';

-- Supprime les lignes invalides de la table principale (comparaison en texte pour compatibilité)
DELETE FROM public.gallery_images
WHERE id::text IN (SELECT id::text FROM public.gallery_images_invalid_backup);

COMMIT;
