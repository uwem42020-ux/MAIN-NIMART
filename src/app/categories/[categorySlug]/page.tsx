// src/app/categories/[categorySlug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { db } from '@/lib/supabase-any';
import type { ProviderWithProfile } from '@/components/provider/ProviderCardPortrait';
import CategoryLandingClient from './CategoryLandingClient';
import { buildMetadata } from '@/lib/seo';

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
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

// cache() ensures this runs only ONCE per request even though it's called
// from both generateMetadata and the page component. Fixes the 5xx pattern.
const getProviders = cache(async () => {
  const { data, error } = await db.rpc('get_search_providers');
  if (error) return { data: [], error };
  return { data: Array.isArray(data) ? data : [], error: null };
});

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const { data: allProviders } = await getProviders();

  const categoryProviders = allProviders.filter(
    (p) => slugify(p.selected_category_slug || '') === categorySlug.toLowerCase()
  );

  if (categoryProviders.length === 0) {
    return {
      title: 'Category Not Found',
      description: 'The service category you are looking for does not have any providers on Nimart yet.',
      robots: { index: false, follow: false },
    };
  }

  const categoryName = (categoryProviders[0]?.selected_category_slug || categorySlug)
    .split('-')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return buildMetadata({
    title: `${categoryName} Services in Nigeria – Find Trusted Providers`,
    description: `Browse ${categoryProviders.length} verified ${categoryName.toLowerCase()} providers across Nigeria. Compare ratings, read reviews, and book trusted ${categoryName.toLowerCase()} services on Nimart.`,
    path: `/categories/${categorySlug}`,
  });
}

export default async function CategoryLandingPage({ params }: CategoryPageProps) {
  const { categorySlug } = await params;
  const { data: allProviders, error } = await getProviders();

  if (error) {
    console.error('Failed to fetch providers for category page:', error);
    return notFound();
  }

  const categoryProviders = allProviders.filter(
    (p) => slugify(p.selected_category_slug || '') === categorySlug.toLowerCase()
  );

  if (categoryProviders.length === 0) {
    return notFound();
  }

  const mappedProviders = categoryProviders.map(mapProvider);
  const categoryName = (categorySlug || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Build states with counts for this category
  const stateMap = new Map<string, number>();
  categoryProviders.forEach((p) => {
    const state = p.profile?.state_name;
    if (state) stateMap.set(state, (stateMap.get(state) || 0) + 1);
  });
  const statesWithCount = [...stateMap.entries()]
    .map(([name, count]) => ({ name, slug: slugify(name), count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.nimart.ng' },
          { '@type': 'ListItem', position: 2, name: 'Categories', item: 'https://www.nimart.ng/search' },
          { '@type': 'ListItem', position: 3, name: categoryName, item: `https://www.nimart.ng/categories/${categorySlug}` },
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
              addressRegion: p.profile.state_name,
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
      <CategoryLandingClient
        categoryName={categoryName}
        categorySlug={categorySlug}
        providers={mappedProviders}
        statesWithCount={statesWithCount}
      />
    </>
  );
}