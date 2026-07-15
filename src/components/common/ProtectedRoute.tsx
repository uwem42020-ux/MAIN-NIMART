// src/components/common/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NimartSpinner } from './NimartSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('customer' | 'provider')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth or setup status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NimartSpinner size="lg" />
      </div>
    );
  }

  // Not logged in – redirect to sign in
  if (!user) {
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  // Logged in but wrong role for this route
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  // Provider needs to complete setup and is not already on the setup page
  const needsSetup = profile?.role === 'provider' && !profile?.is_complete;
  if (needsSetup && !location.pathname.startsWith('/provider/setup')) {
    return <Navigate to="/provider/setup" replace />;
  }

  // All checks passed – render the protected content
  return <>{children}</>;
}