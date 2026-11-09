'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    google: any;
  }
}

export function GoogleOneTap() {
  const router = useRouter();

  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      try {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        });

        if (error) {
          console.error('One Tap error:', error.message);
          // Fallback to regular OAuth if One Tap fails — pass provider intent + attribution
          await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?signup=provider&signup_source=google-one-tap`,
            },
          });
          return;
        }

        const userId = data.user?.id;
        if (!userId) {
          router.refresh();
          return;
        }

        // Fetch current profile to decide: fresh signup vs returning user.
        // Retry up to 5× — trigger may lag slightly behind sign-in.
        let profile: any = null;
        for (let i = 0; i < 5; i++) {
          const { data: p } = await db
            .from('profiles')
            .select('created_at, is_provider, provider_complete, is_complete')
            .eq('id', userId)
            .maybeSingle();
          if (p) {
            profile = p;
            break;
          }
          await new Promise((r) => setTimeout(r, 300));
        }

        const isFresh = profile?.created_at
          ? Date.now() - new Date(profile.created_at).getTime() < 60000
          : false;

        if (isFresh) {
          // Fresh signup via One Tap → make them a provider
          await db
            .from('profiles')
            .update({
              role: 'provider',
              is_provider: true,
              signup_source: 'google-one-tap',
              signup_platform: 'web',
            })
            .eq('id', userId);

          toast.success("Welcome! Let's set up your provider profile.");
          // Full page reload so ProtectedRoute sees is_provider=true from SSR
          window.location.href = '/provider/setup';
          return;
        }

        // Returning user — route by existing capability
        toast.success('Welcome back!');
        if (profile?.is_provider) {
          const setupDone = profile.provider_complete || profile.is_complete;
          router.push(setupDone ? '/provider/dashboard' : '/provider/setup');
        } else {
          router.push('/customer/dashboard');
        }
        router.refresh();
      } catch (error: any) {
        console.error('One Tap sign-in failed:', error.message);
      }
    };

    const checkAndShow = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) return;

      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: handleCredentialResponse,
          auto_select: true,
          cancel_on_tap_outside: false,
          prompt_parent_id: 'google-one-tap-container',
        });

        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.log('One Tap not shown:', notification.getNotDisplayedReason());
          }
        });
      }
    };

    const timeout = setTimeout(checkAndShow, 1000);
    return () => clearTimeout(timeout);
  }, [router]);

  return <div id="google-one-tap-container" className="fixed top-4 right-4 z-50" />;
}