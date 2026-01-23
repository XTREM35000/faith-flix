-- 055_add_approval_status.sql
-- Ajouter le système de statut d'approbation pour vidéos et galerie

-- ===== VIDEOS TABLE =====
-- Ajouter les colonnes de statut
ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Index pour les vidéos en attente
CREATE INDEX IF NOT EXISTS idx_videos_status_submitted_at ON videos (status, submitted_at DESC);

-- Trigger pour mettre à jour submitted_at uniquement à la création
CREATE OR REPLACE FUNCTION set_video_submitted_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' AND NEW.submitted_at IS NULL THEN
    NEW.submitted_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_video_submitted_at ON videos;
CREATE TRIGGER trigger_set_video_submitted_at
BEFORE INSERT ON videos
FOR EACH ROW
EXECUTE FUNCTION set_video_submitted_at();

-- ===== GALLERY_IMAGES TABLE =====
-- Ajouter les colonnes de statut
ALTER TABLE public.gallery_images
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Index pour les galeries en attente
CREATE INDEX IF NOT EXISTS idx_gallery_images_status_submitted_at ON gallery_images (status, submitted_at DESC);

-- Trigger pour mettre à jour submitted_at uniquement à la création
CREATE OR REPLACE FUNCTION set_gallery_submitted_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' AND NEW.submitted_at IS NULL THEN
    NEW.submitted_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_gallery_submitted_at ON gallery_images;
CREATE TRIGGER trigger_set_gallery_submitted_at
BEFORE INSERT ON gallery_images
FOR EACH ROW
EXECUTE FUNCTION set_gallery_submitted_at();

-- ===== TABLE DE SUIVI DES APPROBATIONS =====
CREATE TABLE IF NOT EXISTS content_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'gallery')),
  content_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_type, content_id)
);

-- Index pour les approbations en attente
CREATE INDEX IF NOT EXISTS idx_content_approvals_status ON content_approvals (status, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_approvals_expires_at ON content_approvals (expires_at);

-- ===== FONCTION DE NETTOYAGE (SUPPRESSION APRÈS 24H) =====
CREATE OR REPLACE FUNCTION clean_expired_pending_content()
RETURNS TABLE(deleted_count INT) AS $$
DECLARE
  v_deleted_videos INT := 0;
  v_deleted_galleries INT := 0;
BEGIN
  -- Supprimer les vidéos rejetées ou expirées après 24h
  DELETE FROM public.videos
  WHERE status = 'pending'
  AND submitted_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS v_deleted_videos = ROW_COUNT;

  -- Supprimer les images galerie rejetées ou expirées après 24h
  DELETE FROM public.gallery_images
  WHERE status = 'pending'
  AND submitted_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS v_deleted_galleries = ROW_COUNT;

  -- Nettoyer aussi la table de suivi
  DELETE FROM public.content_approvals
  WHERE expires_at < NOW();

  RETURN QUERY SELECT (v_deleted_videos + v_deleted_galleries)::INT;
END;
$$ LANGUAGE plpgsql;

-- ===== RLS POLICIES =====
-- Les utilisateurs peuvent voir les vidéos/galeries approuvées et leurs propres soumissions
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Policy: Admin peut voir tous les contenus
CREATE POLICY "Admin can view all videos" ON public.videos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Utilisateur peut voir ses propres vidéos en attente
CREATE POLICY "User can view own pending videos" ON public.videos
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR status = 'approved'
  );

-- Policy: Utilisateur ne peut créer que avec status 'pending'
CREATE POLICY "User can insert videos as pending" ON public.videos
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
  );

-- Policy: Seul l'admin peut approuver/rejeter
CREATE POLICY "Admin can update video status" ON public.videos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Policies pour gallery_images
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all gallery images" ON public.gallery_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "User can view own pending gallery images" ON public.gallery_images
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR status = 'approved'
  );

CREATE POLICY "User can insert gallery images as pending" ON public.gallery_images
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
  );

CREATE POLICY "Admin can update gallery image status" ON public.gallery_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

-- ===== RLS POLICIES POUR CONTENT_APPROVALS =====
ALTER TABLE public.content_approvals ENABLE ROW LEVEL SECURITY;

-- Policy: Admin peut voir et modifier tous les contenus en attente
CREATE POLICY "Admin can view all approvals" ON public.content_approvals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can update approval status" ON public.content_approvals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users peuvent voir leurs propres soumissions
CREATE POLICY "Users can view own submissions" ON public.content_approvals
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users peuvent insérer leurs propres soumissions
CREATE POLICY "Users can insert own submissions" ON public.content_approvals
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Comments
COMMENT ON TABLE content_approvals IS 'Suivi des contenus en attente d''approbation avec délai d''expiration 24h';
COMMENT ON COLUMN videos.status IS 'Statut d''approbation: pending, approved, rejected';
COMMENT ON COLUMN videos.submitted_at IS 'Date/heure de soumission';
COMMENT ON COLUMN videos.approved_at IS 'Date/heure d''approbation';
COMMENT ON COLUMN gallery_images.status IS 'Statut d''approbation: pending, approved, rejected';
COMMENT ON FUNCTION clean_expired_pending_content() IS 'Fonction pour supprimer les contenus en attente après 24h sans approbation';
