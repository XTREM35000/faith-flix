import { useAuthContext } from '@/contexts/useAuthContext';

export function useUserRoles() {
  const { role, loading } = useAuthContext();
  const roles = role ? [String(role).toLowerCase()] : [];
  const hasRole = (r: string) => roles.includes(String(r).toLowerCase());
  const isAdmin = hasRole('admin') || hasRole('super_admin') || hasRole('administrateur');
  const isModerator = hasRole('moderator') || hasRole('moderateur') || isAdmin;
  const isMember = roles.length > 0;

  const canEditRole = (targetUserRole?: string) => {
    // Si l'utilisateur courant est super_admin → peut tout modifier
    if (hasRole('super_admin')) return true;
    
    // Si admin → peut modifier tout sauf super_admin
    if (hasRole('admin')) {
      return targetUserRole !== 'super_admin';
    }
    
    return false;
  };

  const isSuperAdmin = hasRole('super_admin');

  return {
    roles,
    loading,
    hasRole,
    isAdmin,
    isModerator,
    isMember,
    canEditRole,
    isSuperAdmin,
    refetch: () => {},
  };
}

export default useUserRoles;

