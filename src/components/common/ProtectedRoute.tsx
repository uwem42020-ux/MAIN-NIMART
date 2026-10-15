// src/components/common/ProtectedRoute.tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { NimartSpinner } from './NimartSpinner';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Require provider capability (is_provider). */
  requireProvider?: boolean;
  /** Require customer capability (is_customer). */
  requireCustomer?: boolean;
}

export function ProtectedRoute({
  children,
  requireProvider,
  requireCustomer,
}: ProtectedRouteProps) {
  const { user, profile, isLoading, isCustomer, isProvider } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const hasProfile = !!profile;

  // Onboarding status: both flags count. Use || (not ??) because
  // provider_complete is NOT NULL DEFAULT false — never nullish — so the
  // ?? chain would short-circuit on it and is_complete would be dead code.
  const providerComplete =
    (profile as any)?.provider_complete === true ||
    (profile as any)?.is_complete === true;

  // Capability mismatch. Only evaluated once profile has loaded.
  const wrongCapability =
    hasProfile &&
    ((requireProvider === true && !isProvider) ||
      (requireCustomer === true && !isCustomer));

  // Provider capability present but onboarding not finished.
  const needsSetup =
    hasProfile && requireProvider === true && isProvider && !providerComplete;

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/auth/signin');
      return;
    }
    if (wrongCapability) {
      router.replace('/');
      return;
    }
    if (needsSetup && !pathname.startsWith('/provider/setup')) {
      router.replace('/provider/setup');
    }
  }, [user, isLoading, wrongCapability, needsSetup, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NimartSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;
  if (wrongCapability) return null;
  if (needsSetup && !pathname.startsWith('/provider/setup')) return null;

  return <>{children}</>;
}