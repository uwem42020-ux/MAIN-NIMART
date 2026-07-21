// src/components/Providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { UpdateNotification } from '@/components/common/UpdateNotification';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { MobileBottomNav } from '@/components/common/MobileBottomNav';
import { InstallPrompt } from '@/components/common/InstallPrompt';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';

export function Providers({
  children,
  initialUser,
  initialProfile,
}: {
  children: React.ReactNode;
  initialUser: any;
  initialProfile: any;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 10,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Firebase lazy loading (after idle)
  useEffect(() => {
    const timeout = setTimeout(async () => {
      try {
        const { initializeApp, getApp, getApps } = await import('firebase/app');
        const { getMessaging, getToken } = await import('firebase/messaging');

        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        const messaging = getMessaging(app);

        if ('serviceWorker' in navigator && 'Notification' in window) {
          try {
            const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
            if (token) console.log('Firebase token:', token);
          } catch (err) {
            console.warn('Unable to get Firebase token:', err);
          }
        }
      } catch (err) {
        console.warn('Firebase failed to load:', err);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialUser={initialUser} initialProfile={initialProfile}>
        <NotificationProvider>
          <UpdateNotification />
          <Header />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer />
          <MobileBottomNav />
          <InstallPrompt />
          <ErrorBoundary>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: { background: '#363636', color: '#fff' },
                success: {
                  duration: 3000,
                  iconTheme: { primary: '#008751', secondary: '#fff' },
                },
              }}
            />
          </ErrorBoundary>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}