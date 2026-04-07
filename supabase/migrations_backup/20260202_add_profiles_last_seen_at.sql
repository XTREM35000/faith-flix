-- 2026-02-02: Ajouter la colonne last_seen_at sur profiles pour la présence

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.last_seen_at IS 'Dernière activité déclarée de l''utilisateur (présence)';

COMMIT;