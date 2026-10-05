// src/app/services/[categorySlug]/in/[lgaId]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/supabase-any';
import { ServiceLocationClient } from './ServiceLocationClient';
import { buildMetadata } from '@/lib/seo';

async function getLocationData(categorySlug: string, lgaId: string) {
  const parsedId = parseInt(lgaId);
  if (isNaN(parsedId)) return null;

  const { data: lgaData } = await db
    .from('lga_centers')
    .select('lga_name, state_name')
    .eq('lga_id', parsedId)
    .maybeSingle();

  return lgaData || null;
}

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string; lgaId: string }> }): Promise<Metadata> {
  const { categorySlug, lgaId } = await params;

  const lgaData = await getLocationData(categorySlug, lgaId);

  if (!lgaData) {
    return {
      title: 'Location Not Found',
      description: 'The location you are looking for does not exist on Nimart.',
      robots: { index: false, follow: false },
    };
  }

  const categoryName = categorySlug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const lgaName = lgaData.lga_name || 'your area';
  const stateName = lgaData.state_name || '';
  const locationString = [lgaName, stateName].filter(Boolean).join(', ');

  return buildMetadata({
    title: `${categoryName} in ${locationString} – Book Trusted Professionals`,
    description: `Find the best ${categoryName.toLowerCase()} in ${locationString}. Browse verified profiles, read reviews, and book trusted ${categoryName.toLowerCase()} near you on Nimart — Nigeria's service marketplace.`,
    path: `/services/${categorySlug}/in/${lgaId}`,
  });
}

export default async function ServiceLocationPage({ params }: { params: Promise<{ categorySlug: string; lgaId: string }> }) {
  const { categorySlug, lgaId } = await params;
  const lgaData = await getLocationData(categorySlug, lgaId);

  if (!lgaData) {
    return notFound();
  }

  return <ServiceLocationClient categorySlug={categorySlug} lgaId={lgaId} lgaData={lgaData} />;
}