// src/app/services/[categorySlug]/in/[lgaId]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { db } from '@/lib/supabase-any';
import { ServiceLocationClient } from './ServiceLocationClient';
import { buildMetadata } from '@/lib/seo';

async function getLocationData(lgaId: string) {
  const parsedId = parseInt(lgaId);
  if (isNaN(parsedId)) return null;

  const { data: lgaData } = await db
    .from('lga_centers')
    .select('lga_name, state_name')
    .eq('lga_id', parsedId)
    .maybeSingle();

  return lgaData || null;
}

// Check if any available providers exist for this category + LGA.
// If not, the page should 404 so Google removes it from the index
// (fixes the "soft 404" problem where empty pages returned 200).
const hasProviders = cache(async (categorySlug: string, lgaId: string) => {
  const parsedId = parseInt(lgaId);
  if (isNaN(parsedId)) return false;

  // Step 1: Find profiles located in this LGA
  const { data: profilesInLga } = await db
    .from('profiles')
    .select('id')
    .eq('lga_id', parsedId);

  const profiles = (profilesInLga as any[]) || [];
  if (!profiles.length) return false;

  const profileIds = profiles.map((p: any) => p.id);

  // Step 2: Check if any available providers match the category
  const { count } = await db
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .eq('is_available', true)
    .eq('selected_category_slug', categorySlug)
    .in('id', profileIds);

  return (count || 0) > 0;
});

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string; lgaId: string }> }): Promise<Metadata> {
  const { categorySlug, lgaId } = await params;

  const lgaData = await getLocationData(lgaId);

  if (!lgaData) {
    return {
      title: 'Location Not Found',
      description: 'The location you are looking for does not exist on Nimart.',
      robots: { index: false, follow: false },
    };
  }

  const exists = await hasProviders(categorySlug, lgaId);
  if (!exists) {
    return {
      title: 'No Providers Found',
      description: 'There are no providers in this category for this location yet.',
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

  const lgaData = await getLocationData(lgaId);
  if (!lgaData) return notFound();

  const exists = await hasProviders(categorySlug, lgaId);
  if (!exists) return notFound();

  return <ServiceLocationClient categorySlug={categorySlug} lgaId={lgaId} lgaData={lgaData} />;
}