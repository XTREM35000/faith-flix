-- Permissions par page pour les rôles dynamiques.
-- Les rôles admin/super_admin/developer gardent l'accès global côté application.

CREATE TABLE IF NOT EXISTS public.role_page_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL,
  page_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT role_page_permissions_role_name_fkey
    FOREIGN KEY (role_name) REFERENCES public.roles(name) ON DELETE CASCADE,
  CONSTRAINT role_page_permissions_unique_role_page UNIQUE (role_name, page_path)
);

CREATE INDEX IF NOT EXISTS idx_role_page_permissions_role_name
  ON public.role_page_permissions(role_name);

CREATE INDEX IF NOT EXISTS idx_role_page_permissions_page_path
  ON public.role_page_permissions(page_path);

ALTER TABLE public.role_page_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "role_page_permissions_select_authenticated" ON public.role_page_permissions;
CREATE POLICY "role_page_permissions_select_authenticated"
ON public.role_page_permissions
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "role_page_permissions_write_admins" ON public.role_page_permissions;
CREATE POLICY "role_page_permissions_write_admins"
ON public.role_page_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(coalesce(p.role, '')) IN ('admin', 'super_admin', 'developer', 'administrateur')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(coalesce(p.role, '')) IN ('admin', 'super_admin', 'developer', 'administrateur')
  )
);
