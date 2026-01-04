-- =====================================================
-- MIGRATION: Création de la table receipts
-- Gère les reçus fiscaux de donation
-- =====================================================

CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Donation reference
  donation_id UUID REFERENCES public.donations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Receipt info
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  fiscal_year INTEGER NOT NULL,
  
  -- Donor info
  donor_name VARCHAR(255) NOT NULL,
  donor_email VARCHAR(255) NOT NULL,
  donor_address TEXT,
  
  -- Donation details
  donation_amount NUMERIC(10, 2) NOT NULL,
  donation_currency VARCHAR(3) DEFAULT 'EUR',
  donation_date DATE NOT NULL,
  donation_type VARCHAR(100),
  
  -- Receipt metadata
  issued_date DATE NOT NULL,
  tax_deductible BOOLEAN DEFAULT TRUE,
  deduction_rate NUMERIC(5, 2) DEFAULT 66.00, -- % for France typically 66%
  
  -- Storage
  pdf_url TEXT, -- URL to PDF receipt file
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_donation_id ON public.receipts(donation_id);
CREATE INDEX IF NOT EXISTS idx_receipts_fiscal_year ON public.receipts(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_receipts_issued_date ON public.receipts(issued_date DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON public.receipts(receipt_number);

-- Enable RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Receipts visible to owner or admin" ON public.receipts;
DROP POLICY IF EXISTS "Only admins can create receipts" ON public.receipts;
DROP POLICY IF EXISTS "Only admins can update receipts" ON public.receipts;
DROP POLICY IF EXISTS "Only admins can delete receipts" ON public.receipts;

-- Read policy: owner or admin
CREATE POLICY "Receipts visible to owner or admin"
  ON public.receipts
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  );

-- Insert policy: admin only
CREATE POLICY "Only admins can create receipts"
  ON public.receipts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  );

-- Update policy: admin only
CREATE POLICY "Only admins can update receipts"
  ON public.receipts
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  );

-- Delete policy: admin only
CREATE POLICY "Only admins can delete receipts"
  ON public.receipts
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS receipts_updated_at_trigger ON public.receipts;
CREATE TRIGGER receipts_updated_at_trigger
  BEFORE UPDATE ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_receipts_updated_at();
