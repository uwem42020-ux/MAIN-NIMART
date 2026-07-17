// src/app/services/[categorySlug]/in/[lgaId]/ServiceLocationClient.tsx
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/supabase-any';
import { ProviderCardPortrait } from '@/components/provider/ProviderCardPortrait';
import { ProviderCardHorizontal } from '@/components/provider/ProviderCardHorizontal';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import { MapPin, Star, LayoutGrid, List, ArrowRight, Shield } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ProviderWithDetails {
  id: string;
  business_name: string | null;
  description: string | null;
  status: string;
  is_available: boolean;
  selected_category_slug: string | null;
  selected_tier_slug: string | null;
  tags: string[] | null;
  boost_until: string | null;
  top_placement_until: string | null;
  profile: any;
  portfolio_images: { id: string; image_url: string }[];
  average_rating: number;
  review_count: number;
  distance: number | null;
  lastSignInAt: string | null;
  is_available_now: boolean;
}

interface ServiceLocationClientProps {
  categorySlug: string;
  lgaId: string;
  lgaData: any;
}

export function ServiceLocationClient({ categorySlug, lgaId, lgaData }: ServiceLocationClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data, isLoading } = useQuery({
    queryKey: ['service-location', categorySlug, lgaId],
    queryFn: async () => {
      if (!categorySlug || !lgaId) return null;

      const { data: profilesInLga } = await db
        .from('profiles')
        .select('id')
        .eq('lga_id', parseInt(lgaId));

      const profiles = (profilesInLga as any[]) || [];
      if (!profiles.length) {
        return { lga: lgaData, providers: [], totalCount: 0 };
      }

      const profileIds = profiles.map((p: any) => p.id);

      const { data: providers, count } = await db
        .from('providers')
        .select('*', { count: 'exact' })
        .eq('is_available', true)
        .eq('selected_category_slug', categorySlug)
        .in('id', profileIds)
        .order('boost_until', { ascending: false, nullsFirst: false })
        .limit(20);

      const providersList = (providers as any[]) || [];
      if (!providersList.length) {
        return { lga: lgaData, providers: [], totalCount: (count as number) || 0 };
      }

      const providerIds = providersList.map((p: any) => p.id);

      const [profilesRes, imagesRes, reviewsRes] = await Promise.all([
        db.from('profiles').select('*').in('id', providerIds),
        db.from('portfolio_images').select('id, provider_id, image_url').in('provider_id', providerIds),
        db.from('reviews').select('provider_id, rating').in('provider_id', providerIds),
      ]);

      const profilesData = (profilesRes.data as any[]) || [];
      const imagesData = (imagesRes.data as any[]) || [];
      const reviewsData = (reviewsRes.data as any[]) || [];

      const profilesMap = new Map(profilesData.map((p: any) => [p.id, p]));
      const imagesMap = new Map<string, any[]>();
      imagesData.forEach((img: any) => {
        if (!imagesMap.has(img.provider_id)) imagesMap.set(img.provider_id, []);
        imagesMap.get(img.provider_id)!.push(img);
      });

      const reviewsMap = new Map<string, { sum: number; count: number }>();
      reviewsData.forEach((r: any) => {
        if (!reviewsMap.has(r.provider_id)) reviewsMap.set(r.provider_id, { sum: 0, count: 0 });
        const cur = reviewsMap.get(r.provider_id)!;
        cur.sum += r.rating;
        cur.count += 1;
      });

      const enriched = providersList.map((provider: any) => {
        const profile = profilesMap.get(provider.id) || null;
        const images = imagesMap.get(provider.id) || [];
        const reviewStats = reviewsMap.get(provider.id);
        const avgRating = reviewStats ? reviewStats.sum / reviewStats.count : 0;

        return {
          ...provider,
          profile,
          portfolio_images: images,
          average_rating: avgRating,
          review_count: reviewStats?.count || 0,
          distance: null,
          lastSignInAt: profile?.updated_at || null,
          is_available_now: provider.status === 'available',
        };
      });

      return {
        lga: lgaData,
        providers: enriched as ProviderWithDetails[],
        totalCount: (count as number) || 0,
      };
    },
    enabled: !!categorySlug && !!lgaId,
  });

  const categoryName = useMemo(() => {
    if (!categorySlug) return '';
    return categorySlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [categorySlug]);

  const lgaName = lgaData?.lga_name || '';
  const stateName = lgaData?.state_name || '';
  const locationString = `${lgaName}, ${stateName}`;

  const breadcrumbItems = [
    { label: 'Home', to: '/' },
    { label: categoryName, to: `/search?category=${categorySlug}` },
    { label: lgaName || 'Area' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NimartSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="bg-gradient-to-br from-primary-600 to-green-600 rounded-2xl p-6 sm:p-10 mb-8 text-white">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
          {categoryName} in {locationString}
        </h1>
        <p className="text-primary-100 text-sm sm:text-base max-w-2xl">
          Browse verified {categoryName.toLowerCase()} in {lgaName}. Read reviews, compare profiles, and book a trusted professional near you on Nimart — Nigeria's service marketplace.
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <Link
            href={`/search?category=${categorySlug}&lga=${lgaId}`}
            className="inline-flex items-center gap-2 bg-white text-primary-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-100 transition"
          >
            Search & Filter
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/auth/signup?role=provider"
            className="inline-flex items-center gap-2 bg-white/20 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-white/30 transition border border-white/30"
          >
            Are you a {categoryName.toLowerCase()}? Join Nimart
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {(data as any)?.totalCount > 0
              ? `${(data as any).totalCount} ${categoryName}${(data as any).totalCount > 1 ? 's' : ''} in ${lgaName}`
              : `No ${categoryName} in ${lgaName} yet`}
          </h2>
          {(data as any)?.totalCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">Read reviews, compare profiles, and book with confidence</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <button onClick={() => setViewMode('grid')} className={cn('p-2 text-gray-500 hover:text-primary-600', viewMode === 'grid' && 'bg-primary-50 text-primary-600')} title="Grid view"><LayoutGrid className="h-5 w-5" /></button>
            <button onClick={() => setViewMode('list')} className={cn('p-2 text-gray-500 hover:text-primary-600', viewMode === 'list' && 'bg-primary-50 text-primary-600')} title="List view"><List className="h-5 w-5" /></button>
          </div>
        </div>
      </div>

      {((data as any)?.providers?.length || 0) === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center">
          <Shield className="mx-auto h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-700">
            Be the first {categoryName.toLowerCase()} in {lgaName}!
          </h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            There are no {categoryName.toLowerCase()} listed in {lgaName} yet. If you're a professional in this area, join Nimart and start getting bookings today.
          </p>
          <Link href="/auth/signup?role=provider" className="mt-6 inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition font-semibold">
            Join as a Provider
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      )}

      {(data as any)?.providers?.length > 0 && (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {(data as any).providers.map((provider: any) => (
                <ProviderCardPortrait key={provider.id} provider={{ ...provider, profile: provider.profile || {}, portfolio_images: provider.portfolio_images || [], distance: provider.distance, average_rating: provider.average_rating, review_count: provider.review_count, lastSignInAt: provider.lastSignInAt }} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {(data as any).providers.map((provider: any) => (
                <ProviderCardHorizontal key={provider.id} provider={{ ...provider, profile: provider.profile || {}, portfolio_images: provider.portfolio_images || [], distance: provider.distance, average_rating: provider.average_rating, review_count: provider.review_count, lastSignInAt: provider.lastSignInAt }} />
              ))}
            </div>
          )}
          <div className="mt-10 bg-gray-50 rounded-2xl p-6 sm:p-8 text-center">
            <h3 className="text-lg font-bold text-gray-900">Don't see the right {categoryName.toLowerCase()}?</h3>
            <p className="text-gray-600 mt-2">Expand your search or check back soon — new providers join Nimart every day.</p>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <Link href="/search" className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-700 transition">Browse All Providers</Link>
              {lgaData?.state_name && <Link href={`/search?state=${categorySlug}`} className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-100 transition">View All in {lgaData.state_name}</Link>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}