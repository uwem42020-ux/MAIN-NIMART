// src/app/services/[categorySlug]/in/[lgaId]/page.tsx
import { Metadata } from 'next';
import { db } from '@/lib/supabase-any';
import { ServiceLocationClient } from './ServiceLocationClient';

async function getLocationData(categorySlug: string, lgaId: string) {
  const { data: lgaData } = await db
    .from('lga_centers')
    .select('lga_name, state_name')
    .eq('lga_id', parseInt(lgaId))
    .single();

  return lgaData as any;
}

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string; lgaId: string }> }): Promise<Metadata> {
  const { categorySlug, lgaId } = await params;

  const lgaData = await getLocationData(categorySlug, lgaId);

  const categoryName = categorySlug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const lgaName = lgaData?.lga_name || 'your area';
  const stateName = lgaData?.state_name || '';
  const locationString = [lgaName, stateName].filter(Boolean).join(', ');

  const title = `${categoryName} in ${locationString} – Book Trusted Professionals | Nimart`;
  const description = `Find the best ${categoryName.toLowerCase()} in ${locationString}. Browse verified profiles, read reviews, and book trusted ${categoryName.toLowerCase()} near you on Nimart — Nigeria's service marketplace.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://nimart.ng/services/${categorySlug}/in/${lgaId}`,
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

export default async function ServiceLocationPage({ params }: { params: Promise<{ categorySlug: string; lgaId: string }> }) {
  const { categorySlug, lgaId } = await params;
  const lgaData = await getLocationData(categorySlug, lgaId);

  return <ServiceLocationClient categorySlug={categorySlug} lgaId={lgaId} lgaData={lgaData} />;
}