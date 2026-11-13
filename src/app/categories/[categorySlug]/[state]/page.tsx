// src/app/categories/[categorySlug]/[state]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { db } from '@/lib/supabase-any';
import type { ProviderWithProfile } from '@/components/provider/ProviderCardPortrait';
import CategoryStateClient from './CategoryStateClient';
import { DemandCapture } from '@/components/seo/DemandCapture';
import { buildMetadata } from '@/lib/seo';

export const revalidate = 3600; // Cache page for 1 hour

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

// 🔥 FIX: Targeted DB query instead of downloading the whole database
const getFilteredProviders = cache(async (categorySlug: string, stateName: string) => {
  const formattedState = stateName.replace(/-/g, ' ');
  
  // Step 1: Get LGAs for this state
  const { data: lgas } = await db.from('lga_centers').select('lga_id').ilike('state_name', formattedState);
  if (!lgas || lgas.length === 0) return [];

  const lgaIds = lgas.map((l: any) => l.lga_id);
  
  // Step 2: Get profiles in these LGAs
  const { data: profiles } = await db.from('profiles').select('id').in('lga_id', lgaIds);
  if (!profiles || profiles.length === 0) return [];
  const profileIds = profiles.map((p: any) => p.id);

  // Step 3: Get providers matching this category and profile IDs
  const { data: providers } = await db
    .from('providers')
    .select('*, profile:profiles(*), portfolio_images:portfolio_images(*), review_stats:review_stats(*)')
    .eq('selected_category_slug', categorySlug)
    .eq('is_available', true)
    .in('id', profileIds);

  return providers || [];
});

export async function generateMetadata({ params }: CategoryStatePageProps): Promise<Metadata> {
  const { categorySlug, state } = await params;
  const providers = await getFilteredProviders(categorySlug, state);
  
  const categoryName = (categorySlug || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const stateName = state.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  if (providers.length === 0) {
    // 🔥 FIX: Return noindex to prevent Google Soft 404 penalties
    return buildMetadata({
      title: `Hiring ${categoryName} in ${stateName} – Join Nimart`,
      description: `We are looking for ${categoryName.toLowerCase()} across ${stateName}. Claim your page, get verified, and get 1,000 free Nicoins.`,
      path: `/categories/${categorySlug}/${state}`,
      noindex: true, // 👈 CRITICAL FIX
    });
  }

  return buildMetadata({
    title: `${categoryName} Services in ${stateName} – Find Trusted Providers`,
    description: `Browse ${providers.length} verified ${categoryName.toLowerCase()} providers in ${stateName}. Compare ratings, read reviews, and book trusted ${categoryName.toLowerCase()} services on Nimart.`,
    path: `/categories/${categorySlug}/${state}`,
  });
}

export default async function CategoryStatePage({ params }: CategoryStatePageProps) {
  const { categorySlug, state } = await params;
  const providers = await getFilteredProviders(categorySlug, state);
  
  const categoryName = (categorySlug || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const stateName = state.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // 🔥 FIX: Show the Demand Capture page instead of 404ing if empty
  if (providers.length === 0) {
    return (
      <DemandCapture 
        categoryName={categoryName} 
        locationName={stateName} 
        categorySlug={categorySlug} 
        stateName={stateName}
      />
    );
  }

  const mappedProviders = providers.map(mapProvider);

  // Group providers by LGA for the sidebar/filters
  const lgaMap = new Map<string, { name: string; count: number }>();
  providers.forEach((p: any) => {
    const lga = p.profile?.lga_name;
    if (lga) {
      const existing = lgaMap.get(lga) || { name: lga, count: 0 };
      existing.count += 1;
      lgaMap.set(lga, existing);
    }
  });
  const lgasWithCount = [...lgaMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  // Generate JSON-LD Structured Data for SEO
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
        itemListElement: mappedProviders.map((p: ProviderWithProfile, index: number) => ({
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