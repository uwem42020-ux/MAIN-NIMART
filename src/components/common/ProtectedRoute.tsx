// src/components/common/ProtectedRoute.tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { NimartSpinner } from './NimartSpinner';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('customer' | 'provider')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/auth/signin');
      return;
    }
    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
      router.replace('/');
      return;
    }
    const needsSetup = profile?.role === 'provider' && !profile?.is_complete;
    if (needsSetup && !pathname.startsWith('/provider/setup')) {
      router.replace('/provider/setup');
    }
  }, [user, profile, isLoading, allowedRoles, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NimartSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) return null;
  const needsSetup = profile?.role === 'provider' && !profile?.is_complete;
  if (needsSetup && !pathname.startsWith('/provider/setup')) return null;

  return <>{children}</>;
};