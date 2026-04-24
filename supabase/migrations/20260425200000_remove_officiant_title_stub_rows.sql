-- Supprime les lignes « modèle » insérées automatiquement (name = titre hiérarchique, sans photo).
-- Un vrai officiant peut théoriquement avoir name = title mais avec photo : on ne touche qu’aux lignes sans photo.

DELETE FROM public.officiants
WHERE trim(name) = trim(coalesce(title, ''))
  AND (photo_url IS NULL OR btrim(photo_url) = '');
