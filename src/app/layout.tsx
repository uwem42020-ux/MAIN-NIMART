// src/app/layout.tsx
import '@/styles/globals.css';
import { Providers } from '@/components/Providers';
import { createServerSupabase } from '@/lib/supabase-server';

export const metadata = {
  title: "Nimart - Nigeria's Trusted Service Marketplace",
  description: 'Connect with verified professionals across Nigeria. Book trusted services for home, auto, beauty, and more.',
  metadataBase: new URL('https://nimart.ng'),
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
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <Providers initialUser={user} initialProfile={initialProfile}>
          {children}
        </Providers>
      </body>
    </html>
  );
}