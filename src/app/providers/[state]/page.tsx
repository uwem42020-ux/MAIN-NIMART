// src/app/providers/[state]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/supabase-any';
import type { ProviderWithProfile } from '@/components/provider/ProviderCardPortrait';
import StateLandingClient from './StateLandingClient';

interface StatePageProps {
  params: Promise<{ state: string }>;
}

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-');
}

function mapProvider(raw: any): ProviderWithProfile {
  return {
    id: raw.id,
    business_name: raw.business_name,
    description: raw.description,
    status: raw.status,
    is_available: raw.is_available,
    selected_tier_slug: raw.selected_tier_slug,
    selected_category_slug: raw.selected_category_slug,
    selected_subcategory_id: raw.selected_subcategory_id,
    tags: raw.tags,
    boost_until: raw.boost_until,
    profile: raw.profile || {},
    portfolio_images: raw.portfolio_images || [],
    average_rating: raw.review_stats?.average_rating ?? 0,
    review_count: raw.review_stats?.review_count ?? 0,
    distance: undefined,
    lastSignInAt: null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { state: stateSlug } = await params;

  const { data: allStates } = await db
    .from('lga_centers')
    .select('state_name, lga_id')
    .not('state_name', 'is', null);

  const distinctStateNames = [...new Set((allStates as any[])?.map((s) => s.state_name))];
  const stateName = distinctStateNames.find((s) => slugify(s) === stateSlug.toLowerCase());

  if (!stateName) {
    return {
      title: 'State Not Found | Nimart',
      description: 'The state you are looking for is not available on Nimart.',
    };
  }

  // Fetch all providers once
  const { data: providersData } = await db.rpc('get_search_providers');
  const allProviders = Array.isArray(providersData) ? providersData : [];
  const stateProviders = allProviders.filter((p: any) => p.profile?.state_name === stateName);

  const title = `Find Verified Service Providers in ${stateName} | Nimart`;
  const description = `Browse ${stateProviders.length} trusted service providers in ${stateName}, Nigeria. Compare ratings, read reviews, and book services like plumbing, electrical, beauty, and more on Nimart.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.nimart.ng/providers/${stateSlug}`,
      siteName: 'Nimart',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  };
}

export default async function StateLandingPage({ params }: StatePageProps) {
  const { state: stateSlug } = await params;

  // Get all states and their providers in one go
  const { data: providersData, error } = await db.rpc('get_search_providers');
  if (error) {
    console.error('Failed to fetch providers for state page:', error);
    return notFound();
  }

  const allProviders = Array.isArray(providersData) ? (providersData as any[]) : [];

  // Build state map
  const stateMap = new Map<string, any[]>();
  allProviders.forEach((p) => {
    const sName = p.profile?.state_name;
    if (sName) {
      if (!stateMap.has(sName)) stateMap.set(sName, []);
      stateMap.get(sName)!.push(p);
    }
  });

  const stateName = [...stateMap.keys()].find((s) => slugify(s) === stateSlug.toLowerCase());

  if (!stateName) {
    return notFound();
  }

  const stateProviders = stateMap.get(stateName) || [];

  // Map providers for client
  const mappedProviders = stateProviders.map(mapProvider);

  // Build all states with counts for cross-linking
  const allStates = [...stateMap.entries()].map(([name, providers]) => ({
    name,
    slug: slugify(name),
    count: providers.length,
  })).sort((a, b) => a.name.localeCompare(b.name));

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.nimart.ng' },
          { '@type': 'ListItem', position: 2, name: 'Providers', item: 'https://www.nimart.ng/search' },
          { '@type': 'ListItem', position: 3, name: stateName, item: `https://www.nimart.ng/providers/${stateSlug}` },
        ],
      },
      {
        '@type': 'ItemList',
        itemListElement: mappedProviders.map((p, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'LocalBusiness',
            name: p.business_name || p.profile?.full_name || 'Provider',
            url: `https://www.nimart.ng/provider/${p.id}`,
            image: p.profile?.avatar_url,
            aggregateRating: p.review_count ? {
              '@type': 'AggregateRating',
              ratingValue: p.average_rating?.toFixed(1),
              reviewCount: p.review_count,
            } : undefined,
            address: p.profile?.lga_name ? {
              '@type': 'PostalAddress',
              addressLocality: p.profile.lga_name,
              addressRegion: stateName,
              addressCountry: 'NG',
            } : undefined,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StateLandingClient
        stateName={stateName}
        providers={mappedProviders}
        allStates={allStates}
      />
    </>
  );
}