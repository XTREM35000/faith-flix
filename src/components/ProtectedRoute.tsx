import React from "react";
import { Navigate, useLocation } from "react-router-dom";
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
  const location = useLocation();

  if (loading || profileLoading) return <div className="p-6">Vérification...</div>;

  if (!user) {
    return <Navigate to="/#auth" state={{ from: location.pathname }} replace />;
  }

  if (requiredRole !== 'member') {
    const authUser: any = user as any;
    const metaRole = authUser?.user_metadata?.role as RoleName | undefined;
    const userRole = (profile?.role || metaRole || 'member') as RoleName;
    if ((roleHierarchy[userRole] || 0) < (roleHierarchy[requiredRole] || 0)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
