// src/app/categories/[categorySlug]/[state]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/supabase-any';
import type { ProviderWithProfile } from '@/components/provider/ProviderCardPortrait';
import CategoryStateClient from './CategoryStateClient';

interface CategoryStatePageProps {
  params: Promise<{ categorySlug: string; state: string }>;
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

export async function generateMetadata({ params }: CategoryStatePageProps): Promise<Metadata> {
  const { categorySlug, state } = await params;

  const { data: providersData } = await db.rpc('get_search_providers');
  const allProviders = Array.isArray(providersData) ? (providersData as any[]) : [];
  const filtered = allProviders.filter(
    (p) =>
      slugify(p.selected_category_slug || '') === categorySlug.toLowerCase() &&
      slugify(p.profile?.state_name || '') === state.toLowerCase()
  );

  if (filtered.length === 0) {
    return {
      title: 'No Providers Found | Nimart',
      description: 'There are no service providers in this category and state yet.',
    };
  }

  const categoryName = (categorySlug || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const stateName = filtered[0]?.profile?.state_name || state;

  const title = `${categoryName} Services in ${stateName} – Find Trusted Providers | Nimart`;
  const description = `Browse ${filtered.length} verified ${categoryName.toLowerCase()} providers in ${stateName}. Compare ratings, read reviews, and book trusted ${categoryName.toLowerCase()} services on Nimart.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.nimart.ng/categories/${categorySlug}/${state}`,
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

export default async function CategoryStatePage({ params }: CategoryStatePageProps) {
  const { categorySlug, state } = await params;

  const { data: providersData, error } = await db.rpc('get_search_providers');
  if (error) return notFound();

  const allProviders = Array.isArray(providersData) ? (providersData as any[]) : [];
  const filtered = allProviders.filter(
    (p) =>
      slugify(p.selected_category_slug || '') === categorySlug.toLowerCase() &&
      slugify(p.profile?.state_name || '') === state.toLowerCase()
  );

  if (filtered.length === 0) return notFound();

  const mappedProviders = filtered.map(mapProvider);
  const categoryName = (categorySlug || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const stateName = filtered[0]?.profile?.state_name || state;

  // LGAs with providers in this category/state
  const lgaMap = new Map<string, { name: string; count: number }>();
  filtered.forEach((p) => {
    const lga = p.profile?.lga_name;
    if (lga) {
      const existing = lgaMap.get(lga) || { name: lga, count: 0 };
      existing.count += 1;
      lgaMap.set(lga, existing);
    }
  });
  const lgasWithCount = [...lgaMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.nimart.ng' },
          { '@type': 'ListItem', position: 2, name: 'Categories', item: 'https://www.nimart.ng/categories' },
          { '@type': 'ListItem', position: 3, name: categoryName, item: `https://www.nimart.ng/categories/${categorySlug}` },
          { '@type': 'ListItem', position: 4, name: stateName, item: `https://www.nimart.ng/categories/${categorySlug}/${state}` },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CategoryStateClient
        categoryName={categoryName}
        categorySlug={categorySlug}
        stateName={stateName}
        providers={mappedProviders}
        lgasWithCount={lgasWithCount}
      />
    </>
  );
}