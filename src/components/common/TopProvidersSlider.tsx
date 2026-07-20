// src/components/common/TopProvidersSlider.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/supabase-any';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/* ---------- local storage helpers ---------- */
const saveToCache = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {}
};

const loadFromCache = (key: string, maxAge = 1000 * 60 * 60 * 24) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > maxAge) return null;
    return data;
  } catch {
    return null;
  }
};

/* ---------- LGA map cache ---------- */
let lgaMapPromise: Promise<Map<number, { lga_name: string; state_name: string }>> | null = null;

const getLgaMap = async () => {
  if (lgaMapPromise) return lgaMapPromise;

  lgaMapPromise = (async () => {
    const map = new Map<number, { lga_name: string; state_name: string }>();
    const { data, error } = await db
      .from('lga_centers')
      .select('lga_id, lga_name, state_name');

    if (error || !data) {
      console.warn('Failed to load LGA map', error);
      return map;
    }

    (data as any[]).forEach((lga: any) => {
      if (lga.lga_id != null) {
        map.set(lga.lga_id, {
          lga_name: lga.lga_name,
          state_name: lga.state_name,
        });
      }
    });
    return map;
  })();

  return lgaMapPromise;
};

/* ---------- skeleton ---------- */
const SkeletonCard = () => (
  <div className="flex-shrink-0 w-28 sm:w-32 md:w-36 lg:w-40 snap-start rounded-xl overflow-hidden animate-pulse bg-gray-200">
    <div className="w-full aspect-[4/5] bg-gray-300" />
    <div className="p-2 space-y-1">
      <div className="h-3 bg-gray-300 rounded w-3/4" />
      <div className="h-2 bg-gray-300 rounded w-1/2" />
    </div>
  </div>
);

/* ---------- component ---------- */
export function TopProvidersSlider({ initialData = [] }: { initialData?: any[] }) {
  const [isOffline, setIsOffline] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    setMounted(true);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { data: topProviders, isLoading } = useQuery({
    queryKey: ['top-providers', 'with-state'],
    queryFn: async () => {
      try {
        const { data: providers, error: providerError } = await db
          .from('providers')
          .select('id, business_name, top_placement_until, boost_until')
          .gte('top_placement_until', new Date().toISOString())
          .eq('is_available', true)
          .order('top_placement_until', { ascending: false })
          .limit(5);

        if (providerError) throw providerError;
        const providersList = (providers || []) as any[];
        if (providersList.length === 0) return [];

        const ids = providersList.map((p: any) => p.id);

        const { data: profiles, error: profileError } = await db
          .from('profiles')
          .select('id, avatar_url, full_name, lga_id, is_verified')
          .in('id', ids);

        if (profileError) throw profileError;
        const profilesList = (profiles || []) as any[];
        const profileMap = new Map(profilesList.map((p: any) => [p.id, p]));

        const lgaMap = await getLgaMap();

        const merged = providersList.map((provider: any) => {
          const prof = profileMap.get(provider.id);
          const lgaInfo = prof?.lga_id != null ? lgaMap.get(prof.lga_id) : undefined;

          return {
            ...provider,
            profile: prof
              ? {
                  ...prof,
                  lga_name: lgaInfo?.lga_name ?? null,
                  state_name: lgaInfo?.state_name ?? null,
                }
              : null,
            isBoosted: provider.boost_until
              ? new Date(provider.boost_until) > new Date()
              : false,
          };
        });

        saveToCache('top-providers-cache', merged);
        return merged;
      } catch (err) {
        const cached = loadFromCache('top-providers-cache');
        if (cached) return cached;
        throw err;
      }
    },
    initialData: initialData.length > 0 ? initialData : undefined,
    staleTime: 1000 * 60 * 60 * 6,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    placeholderData: loadFromCache('top-providers-cache'),
  });

  if (isLoading && !topProviders && initialData.length === 0) {
    return (
      <div className="mb-6 px-2 sm:px-6 lg:px-8">
        <div className="inline-block bg-[#008751] text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
          Top Providers
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
          {[1, 2, 3, 4, 5].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  const displayData = (topProviders || []) as any[];
  if (displayData.length === 0) return null;

  return (
    <div className="mb-6 px-2 sm:px-6 lg:px-8">
      <div className="inline-block bg-[#008751] text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
        Top Providers
        {mounted && isOffline && <span className="ml-2 text-xs text-white/80">(Offline mode)</span>}
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
        {displayData.map((provider: any, index: number) => {
          const prof = provider.profile || {};
          const isVerified = prof.is_verified;
          const isBoosted = provider.isBoosted;
          const bgImage = prof.avatar_url || null;
          const isFirstThree = index <= 2;

          return (
            <Link
              key={provider.id}
              href={`/provider/${provider.id}`}
              className={cn(
                'flex-shrink-0 w-28 sm:w-32 md:w-36 lg:w-40 snap-start rounded-xl',
                isBoosted && 'border-2 border-amber-500'
              )}
            >
              <div className="rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="relative w-full aspect-[4/5] bg-gray-100">
                  {bgImage && isFirstThree ? (
                    <img
                      src={bgImage}
                      alt={provider.business_name || 'Provider'}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="eager"
                      fetchPriority="high"
                      width={160}
                      height={200}
                    />
                  ) : bgImage ? (
                    <OptimizedImage
                      src={bgImage}
                      alt={provider.business_name || 'Provider'}
                      className="absolute inset-0 w-full h-full object-cover"
                      width={160}
                      height={200}
                      loading="lazy"
                      fetchpriority="auto"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-200" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {isVerified && (
                    <div className="absolute top-2 right-2 bg-white rounded-full p-0.5 shadow-sm z-10">
                      <img src="/verify.png" alt="Verified" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                  )}
                  {isBoosted && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-10">
                      BOOSTED
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <div className="font-semibold text-[10px] sm:text-xs text-gray-900 truncate">
                    {provider.business_name}
                  </div>
                  <div className="mt-0.5 space-y-0.5">
                    <div className="flex items-center gap-0.5 text-[8px] sm:text-[10px] text-gray-500 truncate">
                      <MapPin className="h-2 w-2 flex-shrink-0" />
                      <span className="truncate">{prof.lga_name || 'LGA not set'}</span>
                    </div>
                    {prof.state_name && (
                      <div className="text-[10px] sm:text-xs text-gray-600 font-medium truncate">
                        {prof.state_name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}