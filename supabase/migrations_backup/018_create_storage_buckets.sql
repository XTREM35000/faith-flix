-- =====================================================
-- Configuration des buckets de stockage pour Supabase
-- =====================================================

-- 1. Créer le bucket directory-images s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('directory-images', 'directory-images', true)
ON CONFLICT (id) DO NOTHING;
-- 2. Les policies RLS pour `storage.objects` sont owner-only
-- Elles sont extraites dans la migration
-- `018b_storage_policies_owner_only.sql` et doivent être exécutées
-- depuis le Supabase SQL Editor (ou par le propriétaire de la base).
