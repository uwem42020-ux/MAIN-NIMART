// src/app/provider/layout.tsx
'use client';

import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

/**
 * All /provider/* sub-routes that require a signed-in provider.
 * Everything else (like /provider/<uuid>) is the public profile view.
 */
const PROTECTED_SUBROUTES = new Set([
  'setup',
  'dashboard',
  'bookings',
  'messages',
  'portfolio',
  'profile',
  'services',
  'verification',
  'payment',
]);

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // pathname looks like /provider/dashboard or /provider/<uuid>
  const subroute = pathname.split('/').filter(Boolean)[1] ?? '';
  const isProtected = PROTECTED_SUBROUTES.has(subroute);

  // Public profile view — no auth required
  if (!isProtected) {
    return <>{children}</>;
  }

  // Signed-in providers only
  return (
    <ProtectedRoute allowedRoles={['provider']}>
      {children}
    </ProtectedRoute>
  );
}