import { useAuthContext } from '@/contexts/useAuthContext';
import { isAdmin as rpIsAdmin } from '@/utils/rolePermissions';

export function useUser() {
  const { profile, loading, role } = useAuthContext();

  // Utilise la logique centralisée de normalisation des rôles
  const effectiveRole = role ?? profile?.role ?? undefined;
  const isAdmin = rpIsAdmin(effectiveRole || undefined);

  return { profile, isLoading: loading, isAdmin };
}
