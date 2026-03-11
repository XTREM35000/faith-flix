import { useAuthContext } from '@/contexts/AuthContext';

export function useUser() {
  const { profile, loading, role } = useAuthContext();
  const isAdmin = !!(role && ['admin', 'administrateur', 'superadmin'].includes(role.toLowerCase()));
  return { profile, isLoading: loading, isAdmin };
}
