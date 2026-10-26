// src/app/auth/callback/page.tsx
'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import { upgradeToProvider } from '@/lib/upgradeProvider';

// Only accounts created within this window are eligible for auto-upgrade.
// Prevents an existing customer from being upgraded just because they
// clicked "Sign up" by mistake.
const FRESH_ACCOUNT_WINDOW_MS = 5 * 60 * 1000;

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    let mounted = true;

    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session) throw new Error('No session established');

        const signupIntent = searchParams.get('signup');
        const signupSource = searchParams.get('signup_source');

        // Fetch current profile — capability flags are the source of truth.
        const { data: profileData, error: profileError } = await db
          .from('profiles')
          .select('is_provider, is_complete, provider_complete, created_at, signup_source')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        const p = profileData as any;

        // ── Attribution: write source if missing ──
        // Google OAuth doesn't pass metadata to the trigger, so signup_source
        // arrives via URL instead. Write it only if not already set, so we
        // never overwrite a known value.
        if (p && signupSource && !p.signup_source) {
          await db
            .from('profiles')
            .update({ signup_source: signupSource, signup_platform: 'web' })
            .eq('id', session.user.id);
        }

        // ── Provider upgrade (fresh signups only) ──
        const isFresh = p?.created_at
          ? Date.now() - new Date(p.created_at).getTime() < FRESH_ACCOUNT_WINDOW_MS
          : false;

        if (
          signupIntent === 'provider' &&
          p &&
          !p.is_provider &&
          isFresh
        ) {
          const result = await upgradeToProvider(
            session.user.id,
            false,
            refreshProfile,
          );
          if (!result.ok) {
            console.error('Provider upgrade failed:', result.error);
          }
        }

        // Best-effort context sync (onAuthStateChange also fires).
        await refreshProfile();

        // Re-fetch post-upgrade state for accurate routing.
        const { data: fresh } = await db
          .from('profiles')
          .select('is_provider, is_complete, provider_complete')
          .eq('id', session.user.id)
          .single();

        if (!mounted) return;

        const fp = fresh as any;
        if (fp?.is_provider) {
          const setupDone = fp.is_complete || fp.provider_complete;
          router.push(setupDone ? '/provider/dashboard' : '/provider/setup');
        } else {
          router.push('/customer/dashboard');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        toast.error('Authentication failed. Please try again.');
        if (mounted) {
          router.push('/auth/signin');
        }
      }
    };

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [router, refreshProfile, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <NimartSpinner size="lg" />
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <NimartSpinner size="lg" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}