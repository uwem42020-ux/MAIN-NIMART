'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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

        if (error) throw error;

        toast.success('Welcome back!');
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