// src/app/provider/[id]/layout.tsx
import type { Metadata } from 'next';

async function getProviderMeta(id: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };

  try {
    const [providerRes, profileRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/providers?id=eq.${id}&select=business_name,description`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${id}&select=full_name,avatar_url,lga_name`, { headers }),
    ]);

    const [providerData, profileData] = await Promise.all([
      providerRes.ok ? providerRes.json() : [],
      profileRes.ok ? profileRes.json() : [],
    ]);

    const provider = providerData?.[0];
    const profile = profileData?.[0];

    return {
      businessName: provider?.business_name || profile?.full_name || 'Provider',
      description: provider?.description || '',
      lga: profile?.lga_name || 'your area',
      avatar: profile?.avatar_url || '/og-image.png',
    };
  } catch {
    return {
      businessName: 'Provider',
      description: '',
      lga: 'your area',
      avatar: '/og-image.png',
    };
  }
}

// ✅ FIX: await params before using it
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const meta = await getProviderMeta(id);
  return {
    title: `${meta.businessName} – ${meta.lga} on Nimart`,
    description: meta.description || `Book ${meta.businessName} on Nimart.`,
    openGraph: {
      images: [meta.avatar],
    },
    metadataBase: new URL('https://nimart.ng'),
  };
}

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}