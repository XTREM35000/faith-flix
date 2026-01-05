-- =====================================================
-- MIGRATION: Fix About Page RLS Policies
-- Allows admins to see and edit ALL sections, including inactive ones
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "About page sections are viewable by everyone" ON about_page_sections;
DROP POLICY IF EXISTS "Only admins can manage about page sections" ON about_page_sections;

-- Re-create RLS policies with correct admin access

-- 1. Public SELECT: Only active sections visible to everyone
CREATE POLICY "About page sections are viewable by everyone"
  ON about_page_sections
  FOR SELECT
  USING (is_active = TRUE);

-- 2. Admin SELECT: Admins can see ALL sections (active and inactive)
CREATE POLICY "Admins can view all about page sections"
  ON about_page_sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND lower(coalesce(profiles.role, '')) IN ('admin', 'super_admin')
    )
  );

-- 3. Admin INSERT: Only admins can insert
CREATE POLICY "Admins can insert about page sections"
  ON about_page_sections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND lower(coalesce(profiles.role, '')) IN ('admin', 'super_admin')
    )
  );

-- 4. Admin UPDATE: Only admins can update
CREATE POLICY "Admins can update about page sections"
  ON about_page_sections
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND lower(coalesce(profiles.role, '')) IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND lower(coalesce(profiles.role, '')) IN ('admin', 'super_admin')
    )
  );

-- 5. Admin DELETE: Only admins can delete
CREATE POLICY "Admins can delete about page sections"
  ON about_page_sections
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND lower(coalesce(profiles.role, '')) IN ('admin', 'super_admin')
    )
  );

-- Add created_at column if missing
ALTER TABLE about_page_sections ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_about_sections_active ON about_page_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_about_sections_key ON about_page_sections(section_key);
CREATE INDEX IF NOT EXISTS idx_about_sections_display_order ON about_page_sections(display_order);

-- Comment for clarity
COMMENT ON POLICY "About page sections are viewable by everyone" ON about_page_sections IS 'Public users can only see active sections';
COMMENT ON POLICY "Admins can view all about page sections" ON about_page_sections IS 'Admins can see all sections for editing purposes';
