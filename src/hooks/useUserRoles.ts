import { useAuthContext } from '@/contexts/useAuthContext';

export function useUserRoles() {
  const { role, loading } = useAuthContext();
  const roles = role ? [String(role).toLowerCase()] : [];
  const hasRole = (r: string) => roles.includes(String(r).toLowerCase());
  const isAdmin = hasRole('admin') || hasRole('super_admin') || hasRole('administrateur');
  const isModerator = hasRole('moderator') || hasRole('moderateur') || isAdmin;
  const isMember = roles.length > 0;
  return {
    roles,
    loading,
    hasRole,
    isAdmin,
    isModerator,
    isMember,
    refetch: () => {},
  };
}

export default useUserRoles;
