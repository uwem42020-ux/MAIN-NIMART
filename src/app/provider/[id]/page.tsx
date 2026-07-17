// src/app/provider/[id]/page.tsx
import { Metadata } from 'next';
import { ProviderProfileClient } from './ProviderProfileClient';

async function getProvider(id: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };

  try {
    const providerRes = await fetch(
      `${supabaseUrl}/rest/v1/providers?id=eq.${id}&select=*`,
      { headers }
    );
    if (!providerRes.ok) return null;
    const providers = await providerRes.json();
    if (!providers.length) return null;
    const provider = providers[0];

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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const provider = await getProvider(id);

  if (!provider) {
    return {
      title: 'Provider not found | Nimart',
      description: 'The provider you\'re looking for doesn\'t exist or has been removed.',
      robots: { index: false, follow: true },
    };
  }

  const profile = provider.profile || {};
  const businessName = provider.business_name || profile.full_name || 'Provider';
  const category = provider.selected_category_slug
    ? provider.selected_category_slug.replace(/-/g, ' ')
    : 'services';
  const location = [profile.lga_name, profile.state_name].filter(Boolean).join(', ') || 'Nigeria';
  const reviewCount = provider.reviews?.length || 0;
  const rating = reviewCount
    ? (provider.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount).toFixed(1)
    : null;

  const title = rating
    ? `${businessName} – ⭐${rating} ${category} in ${location} | Nimart`
    : `${businessName} – ${category} in ${location} | Nimart`;

  const description = rating
    ? `Book ${businessName} for ${category} in ${location}. Rated ${rating}/5 from ${reviewCount} reviews on Nimart — Nigeria's trusted service marketplace.`
    : `Book ${businessName} for ${category} in ${location} on Nimart — Nigeria's trusted service marketplace. Read reviews, view portfolio, and hire trusted professionals.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : ['/og-image.png'],
      url: `https://nimart.ng/provider/${id}`,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : ['/og-image.png'],
    },
  };
}

export default async function ProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initialProvider = await getProvider(id);

  if (!initialProvider) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Provider not found</h1>
        <p className="text-gray-500">The provider you\'re looking for doesn\'t exist or has been removed.</p>
      </div>
    );
  }

  return <ProviderProfileClient initialProvider={initialProvider} />;
}