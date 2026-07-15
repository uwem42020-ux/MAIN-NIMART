// app/search/page.tsx
import { Metadata } from 'next';
import { supabaseServer } from '@/lib/supabase-server';
import { fetchSearchProviders } from '@/lib/serverQueries';
import { SearchClient } from './SearchClient';
import type { ProviderWithProfile } from '@/components/provider/ProviderCardPortrait';

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getLocationName(type: 'lga' | 'state', id: string): Promise<string> {
  try {
    if (type === 'lga') {
      const { data } = await supabaseServer
        .from('lga_centers')
        .select('lga_name')
        .eq('lga_id', parseInt(id))
        .single();
      return data?.lga_name || id;
    } else {
      const { data } = await supabaseServer
        .from('lga_centers')
        .select('state_name')
        .eq('state_id', parseInt(id))
        .single();
      return data?.state_name || id;
    }
  } catch {
    return id;
  }
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const keyword = (params.q as string) || '';
  const category = (params.category as string) || '';
  const state = (params.state as string) || '';
  const lga = (params.lga as string) || '';

  let title = 'Find Trusted Service Providers in Nigeria | Nimart';
  let description = 'Browse verified professionals across Nigeria. Search by service, location, and ratings.';

  if (keyword || category || lga || state) {
    const parts: string[] = [];
    if (keyword) parts.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    if (category) parts.push(category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    if (lga) {
      const lgaName = await getLocationName('lga', lga);
      parts.push(lgaName);
    } else if (state) {
      const stateName = await getLocationName('state', state);
      parts.push(stateName);
    }
    if (parts.length > 0) {
      title = `${parts.join(' in ')} – Hire Trusted Pros | Nimart`;
      description = `Find ${parts.join(' in ')}. Verified professionals, real reviews, and instant booking on Nimart.`;
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: 'https://nimart.ng/search',
      siteName: 'Nimart',
      images: ['/og-image.png'],
    },
  };
}

// JSON-LD for search results page
function generateSearchSchema(providers: ProviderWithProfile[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: providers.map((p, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'LocalBusiness',
        name: p.business_name || p.profile?.full_name || 'Provider',
        description: p.description,
        url: `https://nimart.ng/provider/${p.id}`,
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
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const { q, tier, category, subcategory, state, lga } = params as Record<string, string | undefined>;

  const initialProviders = await fetchSearchProviders({
    q, tier, category, subcategory, state, lga,
  });

  const schemaJson = generateSearchSchema(initialProviders);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />
      <SearchClient initialProviders={initialProviders} searchParams={{ q, tier, category, subcategory, state, lga }} />
    </>
  );
}