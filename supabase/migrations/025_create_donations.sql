-- =====================================================
-- MIGRATION: Création de la table donations
-- Gère les dons des membres et bienfaiteurs
-- =====================================================

-- 1. Créer enum pour les types de dons
CREATE TYPE donation_type AS ENUM (
  'especes',
  'alimentaire',
  'vestimentaire',
  'materiel',
  'services',
  'autre'
);

-- 2. Créer la table donations
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Donateur
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  donor_name VARCHAR(255),
  donor_email VARCHAR(255),
  donor_phone VARCHAR(30),
  
  -- Donation details
  type donation_type NOT NULL,
  amount_currency VARCHAR(3), -- EUR, USD, etc.
  amount_value NUMERIC(10, 2), -- pour les espèces
  description TEXT, -- description du don
  quantity VARCHAR(100), -- pour les biens (ex: "10 kg", "5 vêtements")
  
  -- Logistique
  donation_date DATE NOT NULL,
  location VARCHAR(255), -- lieu où le don doit être livré
  notes TEXT,
  
  -- Métadonnées
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 2. Créer les index
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON public.donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_type ON public.donations(type);
CREATE INDEX IF NOT EXISTS idx_donations_date ON public.donations(donation_date DESC);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_anonymous ON public.donations(is_anonymous);
CREATE INDEX IF NOT EXISTS idx_donations_verified ON public.donations(is_verified);

-- 3. Activer RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Donations are viewable by donors and admins" ON public.donations;
DROP POLICY IF EXISTS "Users can create their own donations" ON public.donations;
DROP POLICY IF EXISTS "Users can update their own donations" ON public.donations;
DROP POLICY IF EXISTS "Only admins can verify donations" ON public.donations;
DROP POLICY IF EXISTS "Only admins can delete donations" ON public.donations;

-- 5. Politique de lecture : propriétaire ou admin
CREATE POLICY "Donations are viewable by donors and admins"
  ON public.donations
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  );

-- 6. Politique de création pour les utilisateurs authentifiés
CREATE POLICY "Users can create their own donations"
  ON public.donations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- 7. Politique de mise à jour pour le propriétaire
CREATE POLICY "Users can update their own donations"
  ON public.donations
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- 8. Politique de suppression pour les admins seulement
CREATE POLICY "Only admins can delete donations"
  ON public.donations
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  );

-- 9. Créer un trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_donations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS donations_updated_at_trigger ON public.donations;
CREATE TRIGGER donations_updated_at_trigger
  BEFORE UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_donations_updated_at();
