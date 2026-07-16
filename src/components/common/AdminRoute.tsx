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

      await new Promise(resolve => setTimeout(resolve, 100));

      const { data, error } = await db.rpc('is_admin', { user_id: user.id } as any);

      if (error) {
        console.error('Admin verification error:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data as boolean || false);
      }
      setChecking(false);
    }

    verifyAdmin();
  }, [user, authLoading]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NimartSpinner size="lg" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    router.replace('/');
    return null;
  }

  return <>{children}</>;
};