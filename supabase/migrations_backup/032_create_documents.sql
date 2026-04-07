-- =====================================================
-- MIGRATION: Création de la table documents
-- Gère les documents et ressources à télécharger
-- =====================================================

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Document info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER, -- bytes
  file_type VARCHAR(50), -- pdf, docx, xlsx, etc.
  
  -- Ownership
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metadata
  category VARCHAR(100), -- ex: "guide", "template", "formulaire"
  tags TEXT[], -- array of tags
  is_public BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_is_public ON public.documents(is_public);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Documents are viewable by all if public" ON public.documents;
DROP POLICY IF EXISTS "Users can upload documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Only admins can delete documents" ON public.documents;

-- Read policy: public documents visible to all, private only to owner/admin
CREATE POLICY "Documents are viewable by all if public"
  ON public.documents
  FOR SELECT
  USING (
    is_public = TRUE
    OR auth.uid() = uploaded_by
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  );

-- Insert policy: authenticated users can upload
CREATE POLICY "Users can upload documents"
  ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
  );

-- Update policy: owner or admin
CREATE POLICY "Users can update their own documents"
  ON public.documents
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = uploaded_by
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  )
  WITH CHECK (
    auth.uid() = uploaded_by
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  );

-- Delete policy: admin only
CREATE POLICY "Only admins can delete documents"
  ON public.documents
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_updated_at_trigger ON public.documents;
CREATE TRIGGER documents_updated_at_trigger
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_documents_updated_at();
