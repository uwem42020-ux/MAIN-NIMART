// src/components/common/AdminRoute.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { db } from '@/lib/supabase-any';
import { NimartSpinner } from './NimartSpinner';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    async function verifyAdmin() {
      if (!user) {
        setChecking(false);
        return;
      }

      const { data, error } = await db.rpc('is_admin', { user_id: user.id } as any);

      if (error) {
        console.error('Admin verification error:', error);
        setIsAdmin(false);
      } else {
        // The RPC returns true/false directly
        setIsAdmin(data === true);
      }
      setChecking(false);
    }

    verifyAdmin();
  }, [user, authLoading]);

  // Redirect in useEffect, not during render
  useEffect(() => {
    if (!checking && (!user || !isAdmin)) {
      router.replace('/');
    }
  }, [checking, user, isAdmin, router]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NimartSpinner size="lg" />
      </div>
    );
  }

  // Don't render children while redirecting
  if (!user || !isAdmin) {
    return null;
  }

  return <>{children}</>;
};