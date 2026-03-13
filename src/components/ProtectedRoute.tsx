import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

type ProtectedRole = 'admin' | 'super_admin' | 'both';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: ProtectedRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, role, loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to={'/?mode=login#auth'} state={{ from: location.pathname }} replace />;
  }

  if (requiredRole) {
    const effectiveRole = (role || '').toString().toLowerCase();

    const isAdminFamily = effectiveRole === 'admin' || effectiveRole === 'super_admin' || effectiveRole === 'administrateur';
    const isSuperAdmin = effectiveRole === 'super_admin';

    const hasAccess =
      (requiredRole === 'admin' && isAdminFamily) ||
      (requiredRole === 'super_admin' && isSuperAdmin) ||
      (requiredRole === 'both' && isAdminFamily);

    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
