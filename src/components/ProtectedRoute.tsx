import React, { useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";

type RoleName = 'member' | 'moderator' | 'admin' | 'super_admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: RoleName;
}

const roleHierarchy: Record<RoleName, number> = {
  member: 1,
  moderator: 2,
  admin: 3,
  super_admin: 4,
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole = 'member' }) => {
  const { user, loading } = useAuth();
  const { profile, isLoading: profileLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !profileLoading) {
      if (!user) {
        navigate('/auth', { state: { from: location.pathname } });
      } else if (requiredRole !== 'member') {
        // Prefer profile.role, fallback to auth user metadata role if available
        // Some accounts may have role stored in auth metadata before profile is created
        const authUser: any = user as any;
        const metaRole = authUser?.user_metadata?.role as RoleName | undefined;
        const userRole = (profile?.role || metaRole || 'member') as RoleName;
        if ((roleHierarchy[userRole] || 0) < (roleHierarchy[requiredRole] || 0)) {
          navigate('/unauthorized');
        }
      }
    }
  }, [user, loading, profileLoading, requiredRole, navigate, location.pathname, profile]);

  if (loading || profileLoading) return <div className="p-6">Vérification...</div>;
  if (!user) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
