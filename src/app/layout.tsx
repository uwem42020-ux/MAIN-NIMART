// src/app/layout.tsx
import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';
import { createServerSupabase } from '@/lib/supabase-server';
import { GoogleOneTap } from '@/components/common/GoogleOneTap';
import { FacebookPixel } from '@/components/common/FacebookPixel';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nimart.ng'),
  title: {
    default: "Nimart - Nigeria's Trusted Service Marketplace",
    template: '%s | Nimart',
  },
  description:
    'Connect with verified professionals across Nigeria. Book trusted services for home, auto, beauty, and more.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Nimart',
    title: "Nimart - Nigeria's Trusted Service Marketplace",
    description:
      'Connect with verified professionals across Nigeria. Book trusted services for home, auto, beauty, and more.',
    url: 'https://www.nimart.ng',
    locale: 'en_NG',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Nimart' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Nimart - Nigeria's Trusted Service Marketplace",
    description: 'Connect with verified professionals across Nigeria.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  let initialProfile = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_verified, avatar_url, full_name')
      .eq('id', user.id)
      .single();
    initialProfile = profile;
  }

  return (
    <html lang="en">
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <FacebookPixel />
        <Providers initialUser={user} initialProfile={initialProfile}>
          <GoogleOneTap />
          {children}
        </Providers>
      </body>
    </html>
  );
}