// src/app/provider/[id]/page.tsx
import { ProviderProfileClient } from './ProviderProfileClient';

async function getProvider(id: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };

  try {
    // 1. Fetch provider (exactly like the working API test)
    const providerRes = await fetch(
      `${supabaseUrl}/rest/v1/providers?id=eq.${id}&select=*`,
      { headers }
    );
    if (!providerRes.ok) return null;
    const providers = await providerRes.json();
    if (!providers.length) return null;
    const provider = providers[0];

    // 2. Fetch related data in parallel
    const [
      profileRes,
      portfolioRes,
      reviewsRes,
      servicesRes,
      completedRes,
      lastSignInRes,
    ] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${id}&select=*`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/portfolio_images?provider_id=eq.${id}&order=created_at.desc`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/reviews?provider_id=eq.${id}&select=id,rating,content,created_at,reviewer:reviewer_id(full_name,avatar_url)&order=created_at.desc`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/provider_services?provider_id=eq.${id}&order=created_at.asc`, { headers }),
      // RPC calls via REST
      fetch(`${supabaseUrl}/rest/v1/rpc/get_provider_completed_bookings`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_id: id }),
      }),
      fetch(`${supabaseUrl}/rest/v1/rpc/get_user_last_sign_in`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: id }),
      }),
    ]);

    const [
      profileData,
      portfolioData,
      reviewsData,
      servicesData,
      completedData,
      lastSignInData,
    ] = await Promise.all([
      profileRes.ok ? profileRes.json() : null,
      portfolioRes.ok ? portfolioRes.json() : [],
      reviewsRes.ok ? reviewsRes.json() : [],
      servicesRes.ok ? servicesRes.json() : [],
      completedRes.ok ? completedRes.json() : 0,
      lastSignInRes.ok ? lastSignInRes.text().then(t => t ? JSON.parse(t) : null) : null,
    ]);

    return {
      ...provider,
      profile: profileData?.[0] ?? null,
      portfolio_images: portfolioData || [],
      reviews: reviewsData || [],
      services: servicesData || [],
      completedBookings: completedData ?? 0,
      lastSignInAt: lastSignInData ?? null,
      created_at: profileData?.[0]?.created_at ?? null,
    };
  } catch {
    return null;
  }
}

// ✅ FIX: await params before using it
export default async function ProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initialProvider = await getProvider(id);

  if (!initialProvider) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Provider not found</h1>
        <p className="text-gray-500">The provider you’re looking for doesn’t exist or has been removed.</p>
      </div>
    );
  }

  return <ProviderProfileClient initialProvider={initialProvider} />;
}