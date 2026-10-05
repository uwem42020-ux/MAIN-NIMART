// src/app/lga/[lgaId]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { db } from '@/lib/supabase-any';
import type { ProviderWithProfile } from '@/components/provider/ProviderCardPortrait';
import LgaLandingClient from './LgaLandingClient';
import { buildMetadata } from '@/lib/seo';

interface LgaPageProps {
  params: Promise<{ lgaId: string }>;
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

const getProviders = cache(async () => {
  const { data, error } = await db.rpc('get_search_providers');
  if (error) return { data: [], error };
  return { data: Array.isArray(data) ? data : [], error: null };
});

export async function generateMetadata({ params }: LgaPageProps): Promise<Metadata> {
  const { lgaId } = await params;
  const parsedId = parseInt(lgaId);
  if (isNaN(parsedId)) return notFound();

  const { data: allProviders } = await getProviders();
  const lgaProviders = allProviders.filter((p) => p.profile?.lga_id === parsedId);

  if (lgaProviders.length === 0) {
    return {
      title: 'LGA Not Found',
      description: 'The local government area you are looking for does not have any providers on Nimart yet.',
      robots: { index: false, follow: false },
    };
  }

  const lgaName = lgaProviders[0]?.profile?.lga_name || 'Your Area';
  const stateName = lgaProviders[0]?.profile?.state_name || '';

  return buildMetadata({
    title: `Find Trusted Service Providers in ${lgaName}, ${stateName}`,
    description: `Browse ${lgaProviders.length} verified service providers in ${lgaName}, ${stateName}. Compare ratings, read reviews, and book local professionals on Nimart.`,
    path: `/lga/${lgaId}`,
  });
}

export default async function LgaLandingPage({ params }: LgaPageProps) {
  const { lgaId } = await params;
  const parsedId = parseInt(lgaId);
  if (isNaN(parsedId)) return notFound();

  const { data: allProviders, error } = await getProviders();
  if (error) return notFound();

  const lgaProviders = allProviders.filter((p) => p.profile?.lga_id === parsedId);

  if (lgaProviders.length === 0) return notFound();

  const mappedProviders = lgaProviders.map(mapProvider);
  const lgaName = lgaProviders[0]?.profile?.lga_name || 'Your Area';
  const stateName = lgaProviders[0]?.profile?.state_name || '';

  // Category counts
  const categoryMap = new Map<string, number>();
  lgaProviders.forEach((p) => {
    if (p.selected_category_slug) {
      categoryMap.set(p.selected_category_slug, (categoryMap.get(p.selected_category_slug) || 0) + 1);
    }
  });
  const categoriesWithCount = [...categoryMap.entries()]
    .map(([slug, count]) => ({ slug, name: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), count }))
    .sort((a, b) => b.count - a.count);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.nimart.ng' },
          { '@type': 'ListItem', position: 2, name: stateName, item: `https://www.nimart.ng/providers/${stateName.toLowerCase().replace(/\s+/g, '-')}` },
          { '@type': 'ListItem', position: 3, name: lgaName, item: `https://www.nimart.ng/lga/${lgaId}` },
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
            address: {
              '@type': 'PostalAddress',
              addressLocality: lgaName,
              addressRegion: stateName,
              addressCountry: 'NG',
            },
          },
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LgaLandingClient
        lgaName={lgaName}
        stateName={stateName}
        providers={mappedProviders}
        categoriesWithCount={categoriesWithCount}
      />
    </>
  );
}