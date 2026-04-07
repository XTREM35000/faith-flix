-- =====================================================
-- MIGRATION: Création de la table donations
-- Gère les dons et paiements en ligne
-- =====================================================

-- Tout faire dans un bloc sécurisé
DO $$
BEGIN
    -- Supprimer le trigger s'il existe et si la table existe
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'donations' AND schemaname = 'public') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS donations_updated_at_trigger ON public.donations';
    END IF;
    
    -- Supprimer la fonction si elle existe
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_donations_updated_at' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'DROP FUNCTION IF EXISTS public.update_donations_updated_at()';
    END IF;
END $$;

-- Supprimer les types enum s'ils existent
DROP TYPE IF EXISTS payment_status_type CASCADE;
DROP TYPE IF EXISTS payment_method_type CASCADE;

-- Créer enum pour les méthodes de paiement
CREATE TYPE payment_method_type AS ENUM (
  'stripe',
  'cinetpay',
  'cash',
  'bank_transfer'
);

-- Créer enum pour le statut de paiement
CREATE TYPE payment_status_type AS ENUM (
  'pending',
  'completed',
  'failed',
  'cancelled'
);

-- Créer la table donations
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  payer_name VARCHAR(255),
  payer_email VARCHAR(255),
  payer_phone VARCHAR(30),
  intention_message TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'XOF',
  payment_method payment_method_type NOT NULL,
  payment_status payment_status_type DEFAULT 'pending',
  stripe_session_id VARCHAR(255),
  transaction_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON public.donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_payment_method ON public.donations(payment_method);
CREATE INDEX IF NOT EXISTS idx_donations_payment_status ON public.donations(payment_status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_anonymous ON public.donations(is_anonymous);

-- Activer RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Créer les politiques (DROP d'abord si elles existent, mais la table existe maintenant)
DO $$
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Donations are viewable by donors and admins" ON public.donations';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create donations" ON public.donations';
    EXECUTE 'DROP POLICY IF EXISTS "Anonymous users can create donations" ON public.donations';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own donations" ON public.donations';
    EXECUTE 'DROP POLICY IF EXISTS "Only admins can delete donations" ON public.donations';
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

-- Créer les nouvelles politiques
CREATE POLICY "Donations are viewable by donors and admins"
  ON public.donations
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'administrateur'))
  );

CREATE POLICY "Users can create donations"
  ON public.donations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Anonymous users can create donations"
  ON public.donations
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND is_anonymous = true);

CREATE POLICY "Users can update their own donations"
  ON public.donations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can delete donations"
  ON public.donations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'administrateur'))
  );

-- Créer la fonction et le trigger
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