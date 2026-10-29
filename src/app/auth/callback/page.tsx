// src/app/auth/callback/page.tsx
'use client';

import { useEffect, useRef, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const FRESH_ACCOUNT_WINDOW_MS = 5 * 60 * 1000;

function CallbackSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full space-y-4 animate-pulse">
        <div className="h-12 bg-gray-200 rounded-xl" />
        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="h-10 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

function CallbackContent() {
  const { refreshProfile } = useAuth();
  const handledRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const params = new URLSearchParams(window.location.search);
    const signupIntent = params.get('signup');
    const signupSource = params.get('signup_source');

    const doRedirect = async (userId: string) => {
      if (handledRef.current || !mounted) return;
      handledRef.current = true;

      try {
        let profileData: any = null;
        for (let i = 0; i < 5; i++) {
          const { data, error } = await db
            .from('profiles')
            .select('is_provider, is_complete, provider_complete, created_at, signup_source')
            .eq('id', userId)
            .single();
          if (!error && data) {
            profileData = data;
            break;
          }
          if (error && error.code !== 'PGRST116') throw error;
          await new Promise((r) => setTimeout(r, 300));
        }

        const p = profileData;
        if (!p) throw new Error('Profile not found after retries');

        // Compute freshness ONCE — used to gate both attribution and upgrade.
        const isFresh = p.created_at
          ? Date.now() - new Date(p.created_at).getTime() < FRESH_ACCOUNT_WINDOW_MS
          : false;

        // Attribution: only for fresh accounts, never overwrite existing.
        if (isFresh && signupSource && !p.signup_source) {
          await db
            .from('profiles')
            .update({ signup_source: signupSource, signup_platform: 'web' })
            .eq('id', userId);
        }

        // Provider upgrade — fresh + provider-intent + not already provider.
        if (signupIntent === 'provider' && !p.is_provider && isFresh) {
          const { error } = await db
            .from('profiles')
            .update({ role: 'provider', is_provider: true })
            .eq('id', userId);
          if (error) console.error('Provider upgrade failed:', error);
        }

        try { await refreshProfile(); } catch {}

        const { data: fresh } = await db
          .from('profiles')
          .select('is_provider, is_complete, provider_complete')
          .eq('id', userId)
          .single();

        if (!mounted) return;

        const fp = fresh as any;
        let destination: string;
        if (fp?.is_provider) {
          const setupDone = fp.is_complete || fp.provider_complete;
          destination = setupDone ? '/provider/dashboard' : '/provider/setup';
        } else {
          destination = '/customer/dashboard';
        }

        window.location.href = destination;
      } catch (err: any) {
        console.error('Auth callback error:', err);
        toast.error('Authentication failed. Please try again.');
        if (mounted) window.location.href = '/auth/signin';
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && mounted) doRedirect(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user && mounted) {
        doRedirect(session.user.id);
      }
    });

    const timeout = setTimeout(() => {
      if (mounted && !handledRef.current) {
        toast.error('Authentication timed out. Please try again.');
        window.location.href = '/auth/signin';
      }
    }, 10000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <CallbackSkeleton />;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<CallbackSkeleton />}>
      <CallbackContent />
    </Suspense>
  );
}