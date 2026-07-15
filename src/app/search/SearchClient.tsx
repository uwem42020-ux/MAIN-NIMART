// app/search/SearchClient.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ProviderCardPortrait } from '@/components/provider/ProviderCardPortrait';
import { ProviderCardHorizontal } from '@/components/provider/ProviderCardHorizontal';
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedFilterSidebar } from '@/components/search/EnhancedFilterSidebar';
import { SortDropdown } from '@/components/search/SortDropdown';
import { ProviderGridSkeleton } from '@/components/skeletons/ProviderGridSkeleton';
import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useSmartSort } from '@/hooks/useSmartSort';
import {
  Search as SearchIcon,
  X,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProviderWithProfile } from '@/components/provider/ProviderCardPortrait';

interface Suggestion {
  type: 'service' | 'provider' | 'category';
  text: string;
  subtext?: string;
  link: string;
}

interface SearchClientProps {
  initialProviders: ProviderWithProfile[];
  searchParams: {
    q?: string;
    tier?: string;
    category?: string;
    subcategory?: string;
    state?: string;
    lga?: string;
  };
}

export function SearchClient({ initialProviders, searchParams: initialSearchParams }: SearchClientProps) {
  const { profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const keyword = searchParams.get('q') || initialSearchParams.q || '';
  const tier = searchParams.get('tier') || initialSearchParams.tier || undefined;
  const category = searchParams.get('category') || initialSearchParams.category || undefined;
  const subcategory = searchParams.get('subcategory') || initialSearchParams.subcategory || undefined;
  const state = searchParams.get('state') || initialSearchParams.state || undefined;
  const lga = searchParams.get('lga') || initialSearchParams.lga || undefined;

  const userLat = profile?.lat ?? undefined;
  const userLng = profile?.lng ?? undefined;

  const { data: smartSortData } = useSmartSort(
    profile?.id,
    userLat,
    userLng,
    tier,
    category,
    50
  );

  const [searchInput, setSearchInput] = useState(keyword);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedSearchTerm = useDebounce(searchInput, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchInput(keyword);
  }, [keyword]);

  // Autocomplete
  useEffect(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      const term = debouncedSearchTerm.trim();
      const pattern = `%${term}%`;

      const providerPromise = supabase
        .from('providers')
        .select('id, business_name')
        .ilike('business_name', pattern)
        .limit(3);

      const servicePromise = supabase
        .from('provider_services')
        .select('id, name, provider:providers!inner(business_name)')
        .ilike('name', pattern)
        .limit(3);

      const [providerRes, serviceRes] = await Promise.all([providerPromise, servicePromise]);

      const newSuggestions: Suggestion[] = [];

      providerRes.data?.forEach(p => {
        if (p.business_name) {
          newSuggestions.push({
            type: 'provider',
            text: p.business_name,
            subtext: 'Provider',
            link: `/provider/${p.id}`,
          });
        }
      });

      serviceRes.data?.forEach(s => {
        const providerName = (s.provider as any)?.business_name;
        newSuggestions.push({
          type: 'service',
          text: s.name,
          subtext: providerName || 'Service',
          link: `/search?q=${encodeURIComponent(s.name)}`,
        });
      });

      const unique = newSuggestions.filter(
        (v, i, a) => a.findIndex(t => t.text === v.text) === i
      );
      setSuggestions(unique.slice(0, 6));
    };

    fetchSuggestions();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = searchInput.trim();
    if (trimmed) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }
    router.push(`/search?${params.toString()}`);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.type === 'provider') {
      router.push(suggestion.link);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set('q', suggestion.text);
      router.push(`/search?${params.toString()}`);
      setSearchInput(suggestion.text);
    }
    setShowSuggestions(false);
  };

  const { data: providers, isLoading } = useQuery({
    queryKey: ['search-providers', keyword, tier, category, subcategory, state, lga, userLat, userLng, sortBy, smartSortData],
    queryFn: async () => {
      let query = supabase
        .from('providers')
        .select(`
          id,
          business_name,
          description,
          status,
          is_available,
          selected_tier_slug,
          selected_category_slug,
          selected_subcategory_id,
          tags,
          boost_until
        `)
        .eq('is_available', true);

      if (keyword) {
        const pattern = `%${keyword}%`;
        const { data: profilesByName } = await supabase
          .from('profiles')
          .select('id')
          .ilike('full_name', pattern);

        const providerIdsFromName = profilesByName?.map(p => p.id) || [];
        if (providerIdsFromName.length > 0) {
          query = query.or(`business_name.ilike.${pattern},description.ilike.${pattern},id.in.(${providerIdsFromName.join(',')})`);
        } else {
          query = query.or(`business_name.ilike.${pattern},description.ilike.${pattern}`);
        }
      }
      if (tier) query = query.eq('selected_tier_slug', tier);
      if (category) query = query.eq('selected_category_slug', category);
      if (subcategory) query = query.eq('selected_subcategory_id', parseInt(subcategory));

      if (lga) {
        const { data: profilesInLga } = await supabase.from('profiles').select('id').eq('lga_id', parseInt(lga));
        if (profilesInLga?.length) {
          query = query.in('id', profilesInLga.map(p => p.id));
        } else {
          return [] as ProviderWithProfile[];
        }
      } else if (state) {
        const { data: lgasInState } = await supabase.from('lga_centers').select('lga_id').eq('state_id', parseInt(state));
        if (lgasInState?.length) {
          const lgaIds = lgasInState.map(l => l.lga_id);
          const { data: profilesInState } = await supabase.from('profiles').select('id').in('lga_id', lgaIds);
          if (profilesInState?.length) {
            query = query.in('id', profilesInState.map(p => p.id));
          } else {
            return [] as ProviderWithProfile[];
          }
        } else {
          return [] as ProviderWithProfile[];
        }
      }

      query = query.limit(50);
      const { data: providersData, error } = await query;
      if (error) throw error;
      if (!providersData?.length) return [] as ProviderWithProfile[];

      const providerIds = providersData.map(p => p.id);

      const [profilesRes, portfolioRes, reviewsRes] = await Promise.all([
        supabase.from('profiles').select('*').in('id', providerIds),
        supabase.from('portfolio_images').select('*').in('provider_id', providerIds),
        supabase.from('reviews').select('provider_id, rating').in('provider_id', providerIds),
      ]);

      const profiles = profilesRes.data ?? [];
      const portfolioImages = portfolioRes.data ?? [];
      const allReviews = reviewsRes.data ?? [];

      const reviewsMap = new Map<string, { sum: number; count: number }>();
      allReviews.forEach(r => {
        const curr = reviewsMap.get(r.provider_id) || { sum: 0, count: 0 };
        curr.sum += r.rating;
        curr.count += 1;
        reviewsMap.set(r.provider_id, curr);
      });

      let distancesMap: Record<string, number> = {};
      if (userLat && userLng) {
        const { data: distances } = await supabase.rpc('get_provider_distances', {
          user_lat: userLat,
          user_lng: userLng,
          provider_ids: providerIds,
        });
        if (distances) {
          distances.forEach((d: any) => {
            distancesMap[d.provider_id] = d.distance_meters;
          });
        }
      }

      let lastSignInMap: Record<string, string | null> = {};
      if (providerIds.length > 0) {
        const { data: signInData } = await supabase.rpc('get_users_last_sign_in', { user_ids: providerIds });
        if (signInData) {
          signInData.forEach((row: any) => {
            lastSignInMap[row.user_id] = row.last_sign_in_at;
          });
        }
      }

      const providersWithDetails = providersData.map(provider => {
        const providerProfile = profiles.find(p => p.id === provider.id) ?? ({} as any);
        const images = portfolioImages.filter(img => img.provider_id === provider.id) ?? [];
        const distanceMeters = distancesMap[provider.id];
        const distance = distanceMeters ? distanceMeters / 1000 : undefined;
        const reviewStats = reviewsMap.get(provider.id);
        const avgRating = reviewStats ? reviewStats.sum / reviewStats.count : 0;
        const reviewCount = reviewStats?.count || 0;
        const lastSignInAt = lastSignInMap[provider.id] ?? null;

        return {
          ...provider,
          profile: providerProfile,
          portfolio_images: images,
          distance,
          average_rating: avgRating,
          review_count: reviewCount,
          lastSignInAt,
        } as ProviderWithProfile;
      });

      const now = new Date();
      const boosted = providersWithDetails.filter(p => p.boost_until && new Date(p.boost_until) > now);
      const notBoosted = providersWithDetails.filter(p => !p.boost_until || new Date(p.boost_until) <= now);

      const statusPriority = (s: string) => {
        if (s === 'available') return 0;
        if (s === 'busy') return 1;
        return 2;
      };

      const sortGroup = (group: ProviderWithProfile[]) => {
        group.sort((a, b) => {
          const statusA = statusPriority(a.status);
          const statusB = statusPriority(b.status);
          if (statusA !== statusB) return statusA - statusB;

          if (sortBy === 'recommended' && smartSortData?.length) {
            const scoreMap = new Map(smartSortData.map(s => [s.provider_id, s.score]));
            return (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0);
          }

          switch (sortBy) {
            case 'distance':
              return (a.distance ?? Infinity) - (b.distance ?? Infinity);
            case 'rating':
              return (b.average_rating ?? 0) - (a.average_rating ?? 0);
            case 'availability':
              return 0;
            default:
              return (b.average_rating ?? 0) - (a.average_rating ?? 0);
          }
        });
      };

      sortGroup(boosted);
      sortGroup(notBoosted);

      return [...boosted, ...notBoosted];
    },
    initialData: initialProviders,
    staleTime: 1000 * 60 * 2,
  });

  // Format a category slug for display
  const formatCategoryName = (slug?: string) =>
    slug ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';

  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-8 py-6">
      {/* Mobile filter button */}
      <div className="px-4 sm:px-0 mb-4">
        <button
          className="lg:hidden flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <SlidersHorizontal className="h-5 w-5" /> Filters
        </button>
      </div>

      {/* Sidebar overlay for mobile */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative w-80 max-w-[85%] bg-white h-full overflow-y-auto p-4 ml-auto shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <EnhancedFilterSidebar />
          </aside>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block lg:w-64 flex-shrink-0">
          <EnhancedFilterSidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 sm:px-0">
          {/* Search bar with autocomplete */}
          <div className="mb-5 relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search services, providers..."
                  className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 shadow-sm"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      setSuggestions([]);
                      const params = new URLSearchParams(searchParams.toString());
                      params.delete('q');
                      router.push(`/search?${params.toString()}`);
                      inputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button type="submit" className="hidden">Search</button>
            </form>

            {/* Suggestions dropdown */}
            {showSuggestions && debouncedSearchTerm && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-20 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
              >
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(s)}
                    className="w-full flex items-center px-4 py-3 hover:bg-gray-50 transition text-left border-b last:border-0"
                  >
                    <SearchIcon className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.text}</p>
                      {s.subtext && (
                        <p className="text-xs text-gray-500">{s.subtext}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {keyword ? `"${keyword}"` : tier ? `${tier} Services` : category ? formatCategoryName(category) : 'Recommended'}
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn('p-2', viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:text-primary-600')}
                  title="Grid view"
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn('p-2', viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:text-primary-600')}
                  title="List view"
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
              <Link href="/map" className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:text-primary-600" title="Map view">
                <svg className="w-5 h-5" aria-hidden="true">
                  <use href="/icons/sprite.svg#map" />
                </svg>
              </Link>
              <SortDropdown value={sortBy} onChange={setSortBy} />
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <ProviderGridSkeleton />
          ) : !providers || providers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm px-4">
              <img src="/logo.png" alt="Nimart" className="h-12 w-auto mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {keyword || category || lga || state
                  ? `Be the First Provider in ${
                      lga
                        ? 'this LGA'
                        : state
                        ? 'this State'
                        : keyword
                        ? `"${keyword}"`
                        : formatCategoryName(category)
                    }`
                  : "Be the First Provider in Your Area!"}
              </h3>
              <p className="text-gray-600 mb-1">
                {`No providers found${keyword ? ` for "${keyword}"` : ''}${lga || state ? ` in this location` : ''}.`}
              </p>
              <p className="text-primary-700 font-semibold mb-4">
                Get <span className="text-xl">₦1,000</span> when you register as the first provider in this LGA.
              </p>
              <Link
                href={`/auth/signup?role=provider${lga ? `&lga=${lga}` : ''}${state ? `&state=${state}` : ''}`}
                className="inline-block bg-primary-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-700 transition shadow-md"
              >
                Claim ₦1,000 Now →
              </Link>
              <p className="text-xs text-gray-500 mt-4">Limited to first 10 providers per area. Terms apply.</p>
            </div>
          ) : (
            <>
              {/* Mobile: 2‑column grid */}
              <div className="block sm:hidden">
                <div className="columns-2 gap-2">
                  {providers.map((provider) => (
                    <div key={provider.id} className="mb-2 break-inside-avoid">
                      <ProviderCardPortrait provider={provider} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Tablet/Desktop: grid or list */}
              <div className="hidden sm:block">
                {viewMode === 'grid' ? (
                  <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
                    {providers.map((provider) => (
                      <div key={provider.id} className="mb-4 break-inside-avoid">
                        <ProviderCardPortrait provider={provider} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {providers.map((provider) => (
                      <ProviderCardHorizontal key={provider.id} provider={provider} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}