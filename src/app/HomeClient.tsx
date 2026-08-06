// app/HomeClient.tsx
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { FindProvidersRadar } from '@/components/customer/FindProvidersRadar';
import { PopularServicesSlider } from '@/components/home/PopularServicesSlider';
import { MapPin, ChevronDown, Search, WifiOff, LayoutGrid, List, Crosshair, X } from 'lucide-react';
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
  initialPopularCombos: { cat: string; lga: string; lgaId: number; count: number }[];
  initialTopProviders: any[];
}

export function HomeClient({ initialProviders, initialPopularCombos, initialTopProviders }: HomeClientProps) {
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
  const [radarOpen, setRadarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const locationButtonRef = useRef<HTMLButtonElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const autoLocationApplied = useRef(false);
  const isOffline = useOffline();
  const [mounted, setMounted] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedSearchTerm = useDebounce(searchInput, 300);

  const cachedProvidersRef = useRef<ProviderWithProfile[]>(initialProviders);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

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

  useEffect(() => {
    async function preloadLocations() {
      const { data: allStates } = await supabase
        .from('lga_centers')
        .select('state_id, state_name')
        .order('state_name');
      const uniqueStates = (allStates as any[])?.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.state_id === v.state_id) === i) || [];
      setStates(uniqueStates);

      const { data: allLgas } = await supabase
        .from('lga_centers')
        .select('lga_id, lga_name, state_id, lat, lng')
        .order('lga_name');
      if (allLgas) {
        const grouped: Record<string, any[]> = {};
        (allLgas as any[]).forEach((lga) => {
          const key = lga.state_id.toString();
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(lga);
        });
        setPreloadedLgas(grouped);
      }
    }
    preloadLocations();
  }, []);

  const { data: featuredProviders, isLoading } = useQuery({
    queryKey: ['featured-providers', userLat, userLng, stateFilter, lgaFilter],
    queryFn: async () => {
      const { data, error } = await db.rpc('get_featured_providers', { limit_count: 40 });
      if (error || !data) {
        return cachedProvidersRef.current.length > 0 ? cachedProvidersRef.current : [] as ProviderWithProfile[];
      }

      const providers: any[] = Array.isArray(data) ? data : [];

      let filtered = providers;
      if (lgaFilter) {
        filtered = providers.filter((p: any) => p.profile?.lga_id?.toString() === lgaFilter);
      } else if (stateFilter) {
        filtered = providers.filter((p: any) => p.profile?.state_id?.toString() === stateFilter);
      }
      if (filtered.length === 0) return [] as ProviderWithProfile[];

      let result = (filtered.map((item: any) => ({
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

      result.sort((a, b) => {
        const now = new Date();
        const aBoosted = a.boost_until && new Date(a.boost_until) > now ? 1 : 0;
        const bBoosted = b.boost_until && new Date(b.boost_until) > now ? 1 : 0;
        if (aBoosted !== bBoosted) return bBoosted - aBoosted;

        if (smartSortData?.length) {
          const scoreMap = new Map(smartSortData.map(s => [s.provider_id, s.score]));
          const aScore = scoreMap.get(a.id) || 0;
          const bScore = scoreMap.get(b.id) || 0;
          return bScore - aScore;
        }

        return (b.average_rating ?? 0) - (a.average_rating ?? 0);
      });

      cachedProvidersRef.current = result;
      return result;
    },
    initialData: initialProviders,
    staleTime: 1000 * 60 * 5,
  });

  const { data: allProviderCounts } = useQuery({
    queryKey: ['provider-counts'],
    queryFn: async () => {
      const { data, error } = await db.rpc('get_search_providers');
      if (error || !data) return {};
      const providers: any[] = Array.isArray(data) ? data : [];
      const counts: Record<string, number> = {};
      providers.forEach((p: any) => {
        if (p.selected_category_slug) {
          counts[p.selected_category_slug] = (counts[p.selected_category_slug] || 0) + 1;
        }
      });
      return counts;
    },
    staleTime: 1000 * 60 * 10,
  });

  const providerCounts = allProviderCounts ?? {};

  const subcategoryCounts = useMemo(() => {
    const providers = isClient ? featuredProviders : initialProviders;
    const counts: Record<number, number> = {};
    (providers ?? []).forEach(p => {
      if (p.selected_subcategory_id) {
        counts[p.selected_subcategory_id] = (counts[p.selected_subcategory_id] || 0) + 1;
      }
    });
    return counts;
  }, [isClient, featuredProviders, initialProviders]);

  useEffect(() => {
    if (!featuredProviders?.length) return;
    featuredProviders.slice(0, 5).forEach(provider => {
      queryClient.prefetchQuery({
        queryKey: ['provider', provider.id],
        queryFn: () => fetchProviderProfile(provider.id),
        staleTime: 1000 * 60 * 5,
      });
    });
  }, [featuredProviders, queryClient]);

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
      setLocationLabel(label);
    }
    router.push(`?${params.toString()}`);
    setShowLocationDropdown(false);
    autoLocationApplied.current = true;
  };

  const clearLocation = () => {
    router.push('/');
    setLocationLabel('All Nigeria');
    setShowLocationDropdown(false);
    autoLocationApplied.current = true;
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
    const show = isClient ? featuredProviders : initialProviders;
    const isClientMounted = isClient && mounted;

    if (isClient && isLoading && cachedProvidersRef.current.length === 0) {
      return <ProviderGridSkeleton />;
    }

    if (!show || show.length === 0) {
      if (isClientMounted && isOffline) return <OfflineBanner />;
      return <NoProvidersBanner />;
    }

    return (
      <>
        {isClientMounted && isOffline && <OfflineBanner />}
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
      </>
    );
  };

  return (
    <>
      <section className="w-full bg-gray-50 py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-base md:text-lg text-[#008751] text-center mb-4 font-medium">
            Connect with professionals near you
          </p>
          <div className="bg-white/80 backdrop-blur-md rounded-lg shadow-sm border border-gray-200/50 p-4 max-w-3xl mx-auto">
            <div className="flex flex-col gap-3">
              {/* Row 1: Location + Find Providers */}
              <div className="flex flex-row gap-3">
                <div className="relative flex-1">
                  <button
                    ref={locationButtonRef}
                    onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                    className="w-full bg-white text-[#008751] border border-[#008751]/30 rounded-lg px-3 md:px-4 py-3 flex items-center justify-between gap-1 md:gap-2 hover:bg-green-50 transition"
                  >
                    <div className="flex items-center gap-1 md:gap-2">
                      <MapPin className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">{locationLabel}</span>
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
                <button
                  onClick={() => setRadarOpen(true)}
                  className="flex sm:hidden items-center justify-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg px-4 py-3 hover:bg-purple-100 transition font-medium text-sm flex-shrink-0"
                >
                  <Crosshair className="h-5 w-5 animate-spin" />
                  <span>Find</span>
                </button>
              </div>

              {/* Row 2: Search with autocomplete */}
              <div className="flex flex-row gap-3">
                <div className="relative flex-1">
                  <form onSubmit={handleSearch} className="flex bg-white rounded-lg overflow-hidden border border-[#008751]/30">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchInput}
                      onChange={(e) => { setSearchInput(e.target.value); setShowSuggestions(true); }}
                      onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                      placeholder="Search services..."
                      className="w-full px-3 py-3 text-gray-900 focus:outline-none text-sm"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={() => { setSearchInput(''); setSuggestions([]); }}
                        className="text-gray-400 hover:text-gray-600 px-2"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <button type="submit" className="bg-[#008751] hover:bg-green-700 text-white px-3 transition flex items-center justify-center">
                      <Search className="h-5 w-5" />
                    </button>
                  </form>

                  {/* Suggestions dropdown with images */}
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
                <button
                  onClick={() => setRadarOpen(true)}
                  className="hidden sm:flex items-center justify-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg px-4 py-3 hover:bg-purple-100 transition font-medium text-sm flex-shrink-0"
                >
                  <Crosshair className="h-5 w-5 animate-spin" />
                  <span>Find Providers</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PopularServicesSlider initialCombos={initialPopularCombos} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="hidden md:flex gap-6">
          <div className="w-64 flex-shrink-0 self-start">
            <CategorySidebar providerCounts={providerCounts} subcategoryCounts={subcategoryCounts} />
          </div>
          <div className="flex-1">
            <TopProvidersSlider initialData={initialTopProviders} />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {lgaFilter
                  ? `Providers in ${locationName}`
                  : stateFilter
                  ? `Providers in ${locationName}`
                  : 'Recommended Providers'}
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => setViewMode('grid')} className={cn('p-2 text-gray-500 hover:text-primary-600', viewMode === 'grid' && 'bg-primary-50 text-primary-600')} title="Grid view"><LayoutGrid className="h-5 w-5" /></button>
                  <button onClick={() => setViewMode('list')} className={cn('p-2 text-gray-500 hover:text-primary-600', viewMode === 'list' && 'bg-primary-50 text-primary-600')} title="List view"><List className="h-5 w-5" /></button>
                </div>
                <Link href="/search" className="text-primary-600 hover:text-primary-700 text-sm font-medium">View all →</Link>
              </div>
            </div>
            {renderContent()}
          </div>
        </div>

        <div className="block md:hidden">
          <TopProvidersSlider initialData={initialTopProviders} />
          <div className="mb-4 px-4">
            <CategoryButtons providerCounts={providerCounts} subcategoryCounts={subcategoryCounts} />
          </div>
          <section>
            <div className="flex items-center justify-between mb-3 px-4">
              <h2 className="text-lg font-bold text-gray-900">
                {lgaFilter ? `Providers in ${locationName}` : stateFilter ? `Providers in ${locationName}` : 'Recommended'}
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => setViewMode('grid')} className={cn('p-2', viewMode === 'grid' && 'bg-primary-50 text-primary-600')} title="Grid view"><LayoutGrid className="h-4 w-4" /></button>
                  <button onClick={() => setViewMode('list')} className={cn('p-2', viewMode === 'list' && 'bg-primary-50 text-primary-600')} title="List view"><List className="h-4 w-4" /></button>
                </div>
                <Link href="/search" className="text-xs text-primary-600 font-medium">View all →</Link>
              </div>
            </div>
            {renderContent()}
          </section>
        </div>
      </div>
      <FindProvidersRadar
        isOpen={radarOpen}
        onClose={() => setRadarOpen(false)}
        userLat={userLat ?? null}
        userLng={userLng ?? null}
      />
    </>
  );
}