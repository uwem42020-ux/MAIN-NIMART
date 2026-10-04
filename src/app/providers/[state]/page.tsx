// src/app/providers/[state]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { db } from '@/lib/supabase-any';
import type { ProviderWithProfile } from '@/components/provider/ProviderCardPortrait';
import StateLandingClient from './StateLandingClient';
import { buildMetadata } from '@/lib/seo';

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

// cache() ensures this runs only ONCE per request even if called from
// both generateMetadata and the page component. Fixes the 5xx errors.
const getProviders = cache(async () => {
  const { data, error } = await db.rpc('get_search_providers');
  if (error) return { data: [], error };
  return { data: Array.isArray(data) ? data : [], error: null };
});

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const { data: allProviders } = await getProviders();

  const stateMap = new Map<string, any[]>();
  allProviders.forEach((p: any) => {
    const sName = p.profile?.state_name;
    if (sName) {
      if (!stateMap.has(sName)) stateMap.set(sName, []);
      stateMap.get(sName)!.push(p);
    }
  });

  const stateName = [...stateMap.keys()].find((s) => slugify(s) === stateSlug.toLowerCase());

  if (!stateName) {
    return {
      title: 'State Not Found',
      robots: { index: false, follow: false },
    };
  }

  const stateProviders = stateMap.get(stateName) || [];

  return buildMetadata({
    title: `Find Verified Service Providers in ${stateName} | Nimart`,
    description: `Browse ${stateProviders.length} trusted service providers in ${stateName}, Nigeria. Compare ratings, read reviews, and book services like plumbing, electrical, beauty, and more on Nimart.`,
    path: `/providers/${stateSlug}`,
  });
}

export default async function StateLandingPage({ params }: StatePageProps) {
  const { state: stateSlug } = await params;
  const { data: allProviders, error } = await getProviders();

  if (error) {
    console.error('Failed to fetch providers for state page:', error);
    return notFound();
  }

  const stateMap = new Map<string, any[]>();
  allProviders.forEach((p: any) => {
    const sName = p.profile?.state_name;
    if (sName) {
      if (!stateMap.has(sName)) stateMap.set(sName, []);
      stateMap.get(sName)!.push(p);
    }
  });

  const stateName = [...stateMap.keys()].find((s) => slugify(s) === stateSlug.toLowerCase());
  if (!stateName) return notFound();

  const stateProviders = stateMap.get(stateName) || [];
  const mappedProviders = stateProviders.map(mapProvider);

  const allStates = [...stateMap.entries()]
    .map(([name, providers]) => ({
      name,
      slug: slugify(name),
      count: providers.length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

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