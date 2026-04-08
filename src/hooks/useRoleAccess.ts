import { useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '@/contexts/useAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { normalizePagePath, resolvePermissionKeyForPath } from '@/lib/rolePagePermissions';

const GUEST_ALLOWED_PAGE_KEYS = new Set(['/', '/donate']);

export const useRoleAccess = () => {
  const { profile } = useAuthContext();
  const role = String(profile?.role ?? '').toLowerCase();
  const [allowedPages, setAllowedPages] = useState<Set<string>>(new Set());
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!profile) {
        setAllowedPages(new Set());
        setLoadingPermissions(false);
        return;
      }

      if (role === 'developer' || role === 'super_admin' || role === 'admin' || role === 'administrateur') {
        setAllowedPages(new Set());
        setLoadingPermissions(false);
        return;
      }

      setLoadingPermissions(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('role_page_permissions')
          .select('page_path')
          .eq('role_name', role);
        if (error) throw error;

        const pages = new Set<string>();
        (data ?? []).forEach((row: { page_path?: string | null }) => {
          if (!row?.page_path) return;
          const normalized = normalizePagePath(row.page_path);
          const permissionKey = resolvePermissionKeyForPath(normalized) ?? normalized;
          pages.add(permissionKey);
        });
        if (!cancelled) setAllowedPages(pages);
      } catch {
        if (!cancelled) setAllowedPages(new Set());
      } finally {
        if (!cancelled) setLoadingPermissions(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [profile, role]);

  const canAccess = (pageKey: string): boolean => {
    if (!profile) return false;
    const normalized = normalizePagePath(pageKey);
    const permissionKey = resolvePermissionKeyForPath(normalized);

    if (role === 'developer' || role === 'super_admin' || role === 'admin' || role === 'administrateur') return true;
    if (role === 'guest') return GUEST_ALLOWED_PAGE_KEYS.has(normalized);

    // Compatibilité: si aucune permission n'est configurée pour un rôle non-système, ne pas bloquer.
    if (allowedPages.size === 0) return true;
    // Route non gérée par la matrice pages publiques => on ne bloque pas pour éviter les régressions.
    if (!permissionKey) return true;
    return allowedPages.has(permissionKey);
  };

  const showSidebar = (): boolean => role !== 'guest';
  const showUserMenuFull = (): boolean => role !== 'guest';

  return useMemo(
    () => ({ canAccess, showSidebar, showUserMenuFull, loadingPermissions }),
    [profile, role, loadingPermissions, allowedPages]
  );
};
