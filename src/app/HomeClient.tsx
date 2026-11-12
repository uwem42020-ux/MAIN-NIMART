// app/HomeClient.tsx
'use client';

import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { ProviderCardPortrait, type ProviderWithProfile } from '@/components/provider/ProviderCardPortrait';
import { ProviderCardHorizontal } from '@/components/provider/ProviderCardHorizontal';
import { useAuth } from '@/contexts/AuthContext';
import { LocationDropdown } from '@/components/common/LocationDropdown';
import { TopProvidersSlider } from '@/components/common/TopProvidersSlider';
import { CategoryButtons } from '@/components/common/CategoryButtons';
import { CategorySidebar } from '@/components/common/CategorySidebar';
import { MapPin, ChevronDown, Search, WifiOff, LayoutGrid, List, X, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocationStore } from '@/stores/locationStore';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useOffline } from '@/hooks/useOffline';
import { useDebounce } from '@/hooks/useDebounce';
import { ProviderGridSkeleton } from '@/components/skeletons/ProviderGridSkeleton';
import { cn } from '@/lib/utils';
import { useSmartSort } from '@/hooks/useSmartSort';
import { fetchProviderProfile } from '@/lib/queries';

interface Suggestion {
  type: 'service' | 'provider';
  text: string;
  subtext?: string;
  link: string;
  image?: string;
}

interface HomeClientProps {
  initialProviders: ProviderWithProfile[];
  initialPopularCombos?: { cat: string; lga: string; lgaId: number; count: number }[];
  initialTopProviders: any[];
}

export function HomeClient({ initialProviders, initialTopProviders }: HomeClientProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stateFilter = searchParams.get('state');
  const lgaFilter = searchParams.get('lga');

  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationLabel, setLocationLabel] = useState('All Nigeria');
  const [states, setStates] = useState<any[]>([]);
  const [preloadedLgas, setPreloadedLgas] = useState<Record<string, any[]>>({});
  const [locationLoadError, setLocationLoadError] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const locationButtonRef = useRef<HTMLButtonElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const prefetchedIdsRef = useRef<Set<string>>(new Set());
  const isOffline = useOffline();
  const [mounted, setMounted] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedSearchTerm = useDebounce(searchInput, 300);

  useEffect(() => { setMounted(true); }, []);

  useGeolocation();
  const { lat: globalLat, lng: globalLng } = useLocationStore();
  const userLat = profile?.lat ?? globalLat ?? undefined;
  const userLng = profile?.lng ?? globalLng ?? undefined;

  const { data: smartSortData } = useSmartSort(
    profile?.id,
    userLat,
    userLng,
    undefined,
    undefined,
    20
  );

  // ── Autocomplete with images ──
  useEffect(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
      setSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      const term = debouncedSearchTerm.trim();
      const pattern = `%${term}%`;

      const [providerRes, serviceRes] = await Promise.all([
        db.from('providers').select('id, business_name').ilike('business_name', pattern).limit(3),
        db.from('provider_services').select('id, name, provider_id').ilike('name', pattern).limit(3),
      ]);

      const providerIds = ((providerRes.data || []) as any[]).map((p: any) => p.id);

      const { data: profiles } = providerIds.length > 0
        ? await db.from('profiles').select('id, avatar_url').in('id', providerIds)
        : { data: [] };

      const avatarMap = new Map((profiles as any[])?.map((p: any) => [p.id, p.avatar_url]) || []);

      const newSuggestions: Suggestion[] = [];

      (providerRes.data as any[])?.forEach((p: any) => {
        if (p.business_name) {
          newSuggestions.push({
            type: 'provider',
            text: p.business_name,
            subtext: 'Provider',
            link: `/provider/${p.id}`,
            image: avatarMap.get(p.id) || undefined,
          });
        }
      });

      const serviceProviderIds = ((serviceRes.data || []) as any[]).map((s: any) => s.provider_id).filter(Boolean);
      let serviceProvidersMap = new Map<string, string>();
      if (serviceProviderIds.length > 0) {
        const { data: spData } = await db.from('providers').select('id, business_name').in('id', serviceProviderIds);
        (spData as any[])?.forEach((p: any) => serviceProvidersMap.set(p.id, p.business_name));
      }

      (serviceRes.data as any[])?.forEach((s: any) => {
        newSuggestions.push({
          type: 'service',
          text: s.name,
          subtext: serviceProvidersMap.get(s.provider_id) || 'Service',
          link: `/search?q=${encodeURIComponent(s.name)}`,
          image: undefined,
        });
      });

      setSuggestions(newSuggestions.slice(0, 6));
    };
    fetchSuggestions();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        searchInputRef.current && !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.type === 'provider') {
      router.push(suggestion.link);
    } else {
      router.push(`/search?q=${encodeURIComponent(suggestion.text)}`);
      setSearchInput(suggestion.text);
    }
    setShowSuggestions(false);
  };

  // ── Preload locations (with error handling) ──
  useEffect(() => {
    async function preloadLocations() {
      try {
        const { data: allStates, error: e1 } = await supabase
          .from('lga_centers')
          .select('state_id, state_name')
          .order('state_name');
        if (e1) throw e1;
        const uniqueStates = (allStates as any[])?.filter(
          (v: any, i: number, a: any[]) => a.findIndex((t: any) => t.state_id === v.state_id) === i
        ) || [];
        setStates(uniqueStates);

        const { data: allLgas, error: e2 } = await supabase
          .from('lga_centers')
          .select('lga_id, lga_name, state_id, lat, lng')
          .order('lga_name');
        if (e2) throw e2;
        if (allLgas) {
          const grouped: Record<string, any[]> = {};
          (allLgas as any[]).forEach((lga) => {
            const key = lga.state_id.toString();
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(lga);
          });
          setPreloadedLgas(grouped);
        }
      } catch (e) {
        console.error('preloadLocations failed:', e);
        setLocationLoadError(true);
      }
    }
    preloadLocations();
  }, []);

  // Sync label with URL (refresh / back-forward)
  useEffect(() => {
    if (!mounted) return;

    if (stateFilter && states.length > 0) {
      const state = states.find(s => s.state_id.toString() === stateFilter);
      if (state) setLocationLabel(state.state_name);
    } else if (lgaFilter && Object.keys(preloadedLgas).length > 0) {
      for (const key in preloadedLgas) {
        const lga = preloadedLgas[key].find(l => l.lga_id.toString() === lgaFilter);
        if (lga) { setLocationLabel(`${lga.lga_name} LGA`); break; }
      }
    } else if (!stateFilter && !lgaFilter) {
      setLocationLabel('All Nigeria');
    }
  }, [stateFilter, lgaFilter, states, preloadedLgas, mounted]);

  const currentStateName = useMemo(() => {
    if (!stateFilter) return null;
    const state = states.find(s => s.state_id.toString() === stateFilter);
    return state ? state.state_name : null;
  }, [stateFilter, states]);

  // Whether the active location filter is resolved enough to render
  const locationResolved = useMemo(() => {
    if (!stateFilter && !lgaFilter) return true;
    if (stateFilter) return currentStateName !== null;
    if (lgaFilter) return Object.keys(preloadedLgas).length > 0;
    return true;
  }, [stateFilter, lgaFilter, currentStateName, preloadedLgas]);

  // Clear invalid state ID from URL
  useEffect(() => {
    if (!mounted || !stateFilter || states.length === 0) return;
    const state = states.find(s => s.state_id.toString() === stateFilter);
    if (!state) router.replace('/');
  }, [mounted, stateFilter, states, router]);

  // Clear invalid LGA ID from URL
  useEffect(() => {
    if (!mounted || !lgaFilter || Object.keys(preloadedLgas).length === 0) return;
    let found = false;
    for (const key in preloadedLgas) {
      if (preloadedLgas[key].some(l => l.lga_id.toString() === lgaFilter)) { found = true; break; }
    }
    if (!found) router.replace('/');
  }, [mounted, lgaFilter, preloadedLgas, router]);

  // Clear URL if preload failed and a filter is in the URL
  useEffect(() => {
    if (locationLoadError && (stateFilter || lgaFilter)) {
      router.replace('/');
    }
  }, [locationLoadError, stateFilter, lgaFilter, router]);

  // ── Infinite Query ──
  const {
    data: featuredProvidersData,
    isLoading,
    isFetching,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['featured-providers', userLat, userLng, stateFilter, lgaFilter, currentStateName],
    enabled: !stateFilter || !!currentStateName,
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await db.rpc('get_featured_providers', {
        limit_count: 20,
        offset_count: pageParam,
        p_state_name: currentStateName,
        p_lga_id: lgaFilter ? parseInt(lgaFilter) : null,
      });

      if (error) {
        console.error('SUPABASE RPC ERROR:', error);
        return { items: [] as ProviderWithProfile[], rawCount: 0 };
      }
      if (!data) {
        return { items: [] as ProviderWithProfile[], rawCount: 0 };
      }

      const providers: any[] = Array.isArray(data) ? data : [];

      let result = (providers.map((item: any) => ({
        id: item.id,
        business_name: item.business_name,
        description: item.description,
        status: item.status,
        is_available: item.is_available,
        selected_tier_slug: item.selected_tier_slug,
        selected_category_slug: item.selected_category_slug,
        selected_subcategory_id: item.selected_subcategory_id,
        tags: item.tags,
        boost_until: item.boost_until,
        top_placement_until: item.top_placement_until,
        profile: item.profile || {},
        portfolio_images: item.portfolio_images || [],
        average_rating: item.review_stats?.average_rating ?? 0,
        review_count: item.review_stats?.review_count ?? 0,
        distance: undefined as number | undefined,
        starting_price: item.starting_price ?? undefined,
        lastSignInAt: null as string | null,
      })) as any) as ProviderWithProfile[];

      const providerIds = result.map(p => p.id);
      if (userLat && userLng && providerIds.length > 0) {
        const { data: distances } = await db.rpc('get_provider_distances', {
          user_lat: userLat,
          user_lng: userLng,
          provider_ids: providerIds,
        });
        if (distances) {
          const distMap = new Map(distances.map((d: any) => [d.provider_id, d.distance_meters]));
          result = result.map(p => ({
            ...p,
            distance: distMap.has(p.id) ? Number(distMap.get(p.id)) / 1000 : undefined,
          }));
        }
      }

      if (providerIds.length > 0) {
        const { data: signIns } = await db.rpc('get_users_last_sign_in', { user_ids: providerIds });
        if (signIns) {
          const signInMap = new Map(signIns.map((s: any) => [s.user_id, s.last_sign_in_at]));
          result = result.map(p => ({
            ...p,
            lastSignInAt: (signInMap.get(p.id) as string) ?? null,
          }));
        }
      }

      // No client sort here — done in useMemo after combining pages.
      return { items: result, rawCount: providers.length };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.rawCount < 20) return undefined;
      const totalFetched = allPages.reduce((sum, page) => sum + page.rawCount, 0);
      return totalFetched;
    },
    placeholderData: (previousData) => {
      if (previousData) return previousData;
      // Don't use unfiltered SSR data when a location filter is active.
      if (stateFilter || lgaFilter) return undefined;
      return {
        pages: [{ items: initialProviders, rawCount: initialProviders.length }],
        pageParams: [0],
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  // Combine pages, then sort the whole list globally.
  const featuredProviders = useMemo(() => {
    const combined = featuredProvidersData?.pages.flatMap((page) => page.items) ?? [];
    const scoreMap = smartSortData?.length
      ? new Map(smartSortData.map(s => [s.provider_id, s.score]))
      : null;
    const nowMs = Date.now();

    return [...combined].sort((a, b) => {
      const aBoosted = a.boost_until && new Date(a.boost_until).getTime() > nowMs ? 1 : 0;
      const bBoosted = b.boost_until && new Date(b.boost_until).getTime() > nowMs ? 1 : 0;
      if (aBoosted !== bBoosted) return bBoosted - aBoosted;

      if (scoreMap) {
        const aScore = scoreMap.get(a.id) || 0;
        const bScore = scoreMap.get(b.id) || 0;
        return bScore - aScore;
      }
      return (b.average_rating ?? 0) - (a.average_rating ?? 0);
    });
  }, [featuredProvidersData, smartSortData]);

  // Fast category counts from the new RPCs
  const { data: providerCounts = {} } = useQuery({
    queryKey: ['provider-counts'],
    queryFn: async () => {
      const { data, error } = await db.rpc('get_search_provider_counts');
      if (error || !data) return {};
      return data as Record<string, number>;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: subcategoryCounts = {} } = useQuery({
    queryKey: ['subcategory-counts'],
    queryFn: async () => {
      const { data, error } = await db.rpc('get_search_subcategory_counts');
      if (error || !data) return {};
      return data as Record<string, number>;
    },
    staleTime: 1000 * 60 * 10,
  });

  // Prefetch top 5 (dedupe by id — safe against any rerender loops)
  useEffect(() => {
    if (!featuredProviders?.length) return;
    featuredProviders.slice(0, 5).forEach(provider => {
      if (prefetchedIdsRef.current.has(provider.id)) return;
      prefetchedIdsRef.current.add(provider.id);
      queryClient.prefetchQuery({
        queryKey: ['provider', provider.id],
        queryFn: () => fetchProviderProfile(provider.id),
        staleTime: 1000 * 60 * 5,
      });
    });
  }, [featuredProviders, queryClient]);

  // Realtime: invalidate on provider updates
  useEffect(() => {
    const channel = supabase
      .channel('providers-status')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'providers' },
        () => queryClient.invalidateQueries({ queryKey: ['featured-providers'] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const handleLocationSelect = (type: 'state' | 'lga', id: string, label: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === 'state') {
      params.set('state', id);
      params.delete('lga');
      setLocationLabel(label);
    } else {
      params.set('lga', id);
      params.delete('state');
      setLocationLabel(label);
    }
    router.push(`?${params.toString()}`);
    setShowLocationDropdown(false);
  };

  const clearLocation = () => {
    router.push('/');
    setLocationLabel('All Nigeria');
    setShowLocationDropdown(false);
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = searchInputRef.current?.value.trim() || searchInput.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
    setShowSuggestions(false);
  };

  const locationName = lgaFilter
    ? locationLabel.split(',')[0]?.trim() || locationLabel
    : stateFilter
    ? locationLabel
    : '';

  const NoProvidersBanner = () => (
    <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 md:p-8 text-center border-2 border-dashed border-primary-300">
      <img src="/logo.png" alt="Nimart" className="h-12 w-auto mx-auto mb-4" width={48} height={48} />
      <h3 className="text-lg md:text-xl font-bold text-primary-800 mb-2">
        {lgaFilter || stateFilter
          ? `No Provider in ${locationName} for now`
          : "Be the First Provider in This Area!"}
      </h3>
      <p className="text-primary-700 mb-1">
        {lgaFilter || stateFilter
          ? `Be the First Provider in ${locationName}`
          : "Get ₦1,000 when you register as the first provider in your LGA."}
      </p>
      <p className="text-primary-700 mb-4 text-sm md:text-base">
        Get <span className="font-bold text-xl md:text-2xl">₦1,000</span> when you register as the first provider in your LGA.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/auth/signup?role=provider"
          className="inline-block bg-primary-600 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-lg font-medium hover:bg-primary-700 transition"
        >
          Claim ₦1,000 Now →
        </Link>
        <button
          onClick={clearLocation}
          className="inline-block bg-white text-primary-600 border border-primary-300 px-6 md:px-8 py-2.5 md:py-3 rounded-lg font-medium hover:bg-primary-50 transition"
        >
          View All Nigeria 🇳🇬
        </button>
      </div>
      <p className="text-xs text-primary-600 mt-3 md:mt-4">Limited to first 10 providers per area. Terms apply.</p>
    </div>
  );

  const OfflineBanner = () => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center gap-3 mb-4">
      <WifiOff className="h-5 w-5 text-yellow-600 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-yellow-800">You're offline</p>
        <p className="text-xs text-yellow-600">Showing previously loaded providers. Connect to the internet for the latest updates.</p>
      </div>
    </div>
  );

  const renderContent = () => {
    const show = mounted ? featuredProviders : initialProviders;

    // Guard: filter is in the URL but not yet resolved → skeleton, don't flash unfiltered data
    if (mounted && !locationResolved) {
      return <ProviderGridSkeleton />;
    }

    // Loading state (also covers the 1-frame window when enabled just flipped true)
    if (mounted && show.length === 0 && !isError && (isLoading || isFetching || !featuredProvidersData)) {
      return <ProviderGridSkeleton />;
    }

    if (!show || show.length === 0) {
      if (mounted && isOffline) return <OfflineBanner />;
      return <NoProvidersBanner />;
    }

    return (
      <>
        {mounted && isOffline && <OfflineBanner />}
        {viewMode === 'grid' ? (
          <div className="columns-2 sm:columns-3 lg:columns-3 xl:columns-3 gap-4 pr-2">
            {show.map((provider, index) => (
              <div key={provider.id} className="mb-4 break-inside-avoid">
                <ProviderCardPortrait
                  provider={provider}
                  imageLoading={index === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {show.map(provider => (
              <ProviderCardHorizontal key={provider.id} provider={provider} />
            ))}
          </div>
        )}

        {hasNextPage && (
          <div className="flex justify-center mt-8 w-full">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="flex items-center gap-2 bg-white border border-gray-200 shadow-sm text-gray-800 px-8 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isFetchingNextPage ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Loading...</>
              ) : (
                'Load More Providers'
              )}
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <style>{`
        @keyframes nimart-gentle-float {
          0%, 100% { transform: translateY(0); opacity: 0.7; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
        .animate-nimart-gentle-float { animation: nimart-gentle-float 2.5s ease-in-out infinite; }
      `}</style>

      <section className="w-full bg-gray-50 py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-base md:text-lg text-[#008751] text-center mb-4 font-medium">
            Connect with professionals near you
          </p>
          <div className="bg-white/80 backdrop-blur-md rounded-lg shadow-sm border border-gray-200/50 p-4 max-w-3xl mx-auto">
            <div className="flex flex-row gap-2 sm:gap-3 items-center w-full">
              <div className="relative w-[130px] sm:w-44 flex-shrink-0">
                <button
                  ref={locationButtonRef}
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  className="w-full bg-white text-[#008751] border border-[#008751]/30 rounded-lg px-2 sm:px-3 py-3 flex items-center justify-between gap-1 hover:bg-green-50 transition"
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="truncate text-sm">{locationLabel}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                </button>
                {showLocationDropdown && (
                  <LocationDropdown
                    onSelectState={(id, name) => handleLocationSelect('state', id, name)}
                    onSelectLga={(id, name) => handleLocationSelect('lga', id, `${name} LGA`)}
                    onClear={clearLocation}
                    onClose={() => setShowLocationDropdown(false)}
                    preloadedStates={states}
                    preloadedLgas={preloadedLgas}
                    triggerRef={locationButtonRef}
                  />
                )}
              </div>

              <div className="relative flex-1 min-w-0">
                <form onSubmit={handleSearch} className="flex bg-white rounded-lg overflow-hidden border border-[#008751]/30 shadow-sm">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchInput}
                    onChange={(e) => { setSearchInput(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    placeholder="Search services..."
                    className="w-full px-3 sm:px-4 py-3 text-gray-900 focus:outline-none text-sm sm:text-base"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => { setSearchInput(''); setSuggestions([]); }}
                      className="text-gray-400 hover:text-gray-600 px-2"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                  <button type="submit" className="bg-[#008751] hover:bg-green-700 text-white px-3 sm:px-5 transition flex items-center justify-center">
                    <Search className="h-5 w-5" />
                  </button>
                </form>

                {showSuggestions && debouncedSearchTerm && suggestions.length > 0 && (
                  <div ref={suggestionsRef} className="absolute z-20 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(s)}
                        className="w-full flex items-center px-4 py-3 hover:bg-gray-50 transition text-left border-b last:border-0"
                      >
                        {s.image ? (
                          <img
                            src={`${s.image}?width=32&height=32&quality=60&resize=cover`}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover mr-3 flex-shrink-0 bg-gray-200"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center mr-3 flex-shrink-0">
                            <Search className="h-4 w-4 text-primary-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.text}</p>
                          {s.subtext && <p className="text-xs text-gray-500">{s.subtext}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ⬇️ SINGLE responsive tree — no double render of ProviderCards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:gap-6">
          {/* Sidebar — desktop only */}
          <div className="hidden md:block md:w-64 md:flex-shrink-0 md:self-start">
            <CategorySidebar providerCounts={providerCounts} subcategoryCounts={subcategoryCounts} />
          </div>

          <div className="flex-1 min-w-0">
            <TopProvidersSlider initialData={initialTopProviders} />

            {/* Category pill row — mobile only */}
            <div className="md:hidden mb-4 px-4">
              <CategoryButtons providerCounts={providerCounts} subcategoryCounts={subcategoryCounts} />
            </div>

            {/* Responsive header — one instance */}
            <div className="flex items-center justify-between mb-3 md:mb-4 px-4 md:px-0">
              <div className="flex items-center gap-2 md:gap-3">
                <img
                  src="/top.png"
                  alt=""
                  className="h-6 w-6 md:h-7 md:w-7 object-contain animate-nimart-gentle-float flex-shrink-0"
                />
                <div
                  className="px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-semibold text-white shadow-md"
                  style={{
                    background: 'linear-gradient(to left, #597400, #98BC00)',
                    boxShadow: '0 4px 12px rgba(89, 116, 0, 0.25)',
                  }}
                >
                  <span className="md:hidden">
                    {lgaFilter
                      ? `Popular in ${locationName}`
                      : stateFilter
                      ? `Popular in ${locationName}`
                      : 'Popular Providers'}
                  </span>
                  <span className="hidden md:inline">
                    {lgaFilter
                      ? `Popular Providers in ${locationName}`
                      : stateFilter
                      ? `Popular Providers in ${locationName}`
                      : 'Popular Providers in Nigeria'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn('p-1.5 md:p-2 text-gray-500 hover:text-primary-600', viewMode === 'grid' && 'bg-primary-50 text-primary-600')}
                    title="Grid view"
                  >
                    <LayoutGrid className="h-4 w-4 md:h-5 md:w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn('p-1.5 md:p-2 text-gray-500 hover:text-primary-600', viewMode === 'list' && 'bg-primary-50 text-primary-600')}
                    title="List view"
                  >
                    <List className="h-4 w-4 md:h-5 md:w-5" />
                  </button>
                </div>
                <Link href="/search" className="text-xs md:text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View all →
                </Link>
              </div>
            </div>

            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
}