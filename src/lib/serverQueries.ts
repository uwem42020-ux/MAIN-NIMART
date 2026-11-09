// src/lib/serverQueries.ts
import { db } from '@/lib/supabase-any';
import type { ProviderWithProfile } from '@/components/provider/ProviderCardPortrait';

export async function fetchInitialProviders(): Promise<ProviderWithProfile[]> {
  const { data, error } = await db.rpc('get_featured_providers', { limit_count: 25 } as any);
  if (error || !data) return [];

  const providers: any[] = Array.isArray(data) ? data : [];

  return providers.map(item => ({
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
    distance: undefined,
    starting_price: item.starting_price ?? undefined,
    lastSignInAt: null,
  })) as unknown as ProviderWithProfile[];
}

/**
 * Server-side search providers with DB-level filtering.
 *
 * NOTE: Previously this called `db.rpc('get_search_providers')` which returned
 * EVERY provider in the database, then filtered in JS. That was the root cause
 * of the 2-5s "View all →" hang. Now it filters at the DB level using direct
 * Supabase queries (matching SearchClient's client-side behavior for
 * consistency between SSR and hydration).
 */
export async function fetchSearchProviders(searchParams: {
  q?: string;
  tier?: string;
  category?: string;
  subcategory?: string;
  state?: string;
  lga?: string;
}): Promise<ProviderWithProfile[]> {
  const { q, tier, category, subcategory, state, lga } = searchParams;

  let query = db
    .from('providers')
    .select(`
      id, business_name, description, status, is_available,
      selected_tier_slug, selected_category_slug, selected_subcategory_id,
      tags, boost_until, top_placement_until
    `)
    .eq('is_available', true);

  if (q) {
    const pattern = `%${q}%`;
    // Match full_name too (matches SearchClient's behavior)
    const { data: profilesByName } = await db
      .from('profiles')
      .select('id')
      .ilike('full_name', pattern);

    const providerIdsFromName = ((profilesByName as any[]) ?? []).map((p: any) => p.id);

    if (providerIdsFromName.length > 0) {
      query = query.or(
        `business_name.ilike.${pattern},description.ilike.${pattern},id.in.(${providerIdsFromName.join(',')})`
      );
    } else {
      query = query.or(`business_name.ilike.${pattern},description.ilike.${pattern}`);
    }
  }

  if (tier) query = query.eq('selected_tier_slug', tier);
  if (category) query = query.eq('selected_category_slug', category);
  if (subcategory) query = query.eq('selected_subcategory_id', parseInt(subcategory));

  // Location filtering — resolve profile IDs first, then filter providers by id
  if (lga) {
    const lgaId = parseInt(lga);
    if (!isNaN(lgaId)) {
      const { data: profilesInLga } = await db
        .from('profiles')
        .select('id')
        .eq('lga_id', lgaId);
      const ids = ((profilesInLga as any[]) ?? []).map((p: any) => p.id);
      if (ids.length === 0) return [];
      query = query.in('id', ids);
    }
  } else if (state) {
    // state can arrive as numeric ID or as state name (SEO URLs)
    let stateId: number | null = null;
    const parsed = parseInt(state);
    if (!isNaN(parsed)) {
      stateId = parsed;
    } else {
      const { data: stateData } = await db
        .from('lga_centers')
        .select('state_id')
        .eq('state_name', state)
        .limit(1);
      if ((stateData as any[])?.length) {
        stateId = (stateData as any[])[0].state_id;
      }
    }
    if (stateId === null) return [];

    const { data: lgasInState } = await db
      .from('lga_centers')
      .select('lga_id')
      .eq('state_id', stateId);
    const lgaIds = ((lgasInState as any[]) ?? []).map((l: any) => l.lga_id);
    if (lgaIds.length === 0) return [];

    const { data: profilesInState } = await db
      .from('profiles')
      .select('id')
      .in('lga_id', lgaIds);
    const ids = ((profilesInState as any[]) ?? []).map((p: any) => p.id);
    if (ids.length === 0) return [];
    query = query.in('id', ids);
  }

  // Bound the result set — the client only ever displays this many anyway
  const { data: providersData, error } = await query.limit(100);
  if (error || !(providersData as any[])?.length) return [];

  const providerIds = (providersData as any[]).map((p: any) => p.id);

  const [profilesRes, portfolioRes, reviewsRes] = await Promise.all([
    db.from('profiles').select('*').in('id', providerIds),
    db.from('portfolio_images').select('*').in('provider_id', providerIds),
    db.from('reviews').select('provider_id, rating').in('provider_id', providerIds),
  ]);

  const profiles = (profilesRes.data as any[]) ?? [];
  const portfolioImages = (portfolioRes.data as any[]) ?? [];
  const allReviews = (reviewsRes.data as any[]) ?? [];

  const profilesMap = new Map<string, any>();
  profiles.forEach((p: any) => profilesMap.set(p.id, p));

  const portfolioMap = new Map<string, any[]>();
  portfolioImages.forEach((img: any) => {
    const arr = portfolioMap.get(img.provider_id) ?? [];
    arr.push(img);
    portfolioMap.set(img.provider_id, arr);
  });

  const reviewsMap = new Map<string, { sum: number; count: number }>();
  allReviews.forEach((r: any) => {
    const curr = reviewsMap.get(r.provider_id) ?? { sum: 0, count: 0 };
    curr.sum += r.rating;
    curr.count += 1;
    reviewsMap.set(r.provider_id, curr);
  });

  const providersWithDetails = (providersData as any[]).map((provider: any) => {
    const reviewStats = reviewsMap.get(provider.id);
    const avgRating = reviewStats ? reviewStats.sum / reviewStats.count : 0;
    const reviewCount = reviewStats?.count ?? 0;

    return {
      ...provider,
      profile: profilesMap.get(provider.id) ?? {},
      portfolio_images: portfolioMap.get(provider.id) ?? [],
      distance: undefined,
      average_rating: avgRating,
      review_count: reviewCount,
      lastSignInAt: null,
    } as ProviderWithProfile;
  });

  // Sort: boosted first, then by rating (matches client default sort)
  const now = new Date();
  const boosted: ProviderWithProfile[] = [];
  const notBoosted: ProviderWithProfile[] = [];

  providersWithDetails.forEach((p: any) => {
    if (p.boost_until && new Date(p.boost_until) > now) {
      boosted.push(p);
    } else {
      notBoosted.push(p);
    }
  });

  boosted.sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0));
  notBoosted.sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0));

  return [...boosted, ...notBoosted];
}

export async function fetchPopularCombos(): Promise<{ cat: string; lga: string; lgaId: number; count: number }[]> {
  const { data: providers } = await db
    .from('providers')
    .select('id, selected_category_slug')
    .eq('is_available', true)
    .not('selected_category_slug', 'is', null)
    .limit(100);

  if (!providers || (providers as any[]).length === 0) return [];

  const providerIds = (providers as any[]).map((p: any) => p.id);

  const { data: profiles } = await db
    .from('profiles')
    .select('id, lga_name, lga_id')
    .in('id', providerIds)
    .not('lga_name', 'is', null);

  if (!profiles || (profiles as any[]).length === 0) return [];

  const profileMap = new Map((profiles as any[]).map((p: any) => [p.id, p]));
  const countMap = new Map<string, number>();

  (providers as any[]).forEach((p: any) => {
    const profile = profileMap.get(p.id);
    if (!profile) return;
    const key = `${p.selected_category_slug}||${profile.lga_name}||${profile.lga_id}`;
    countMap.set(key, (countMap.get(key) || 0) + 1);
  });

  return Array.from(countMap.entries())
    .map(([key, count]) => {
      const [cat, lga, lgaId] = key.split('||');
      return { cat, lga, lgaId: parseInt(lgaId), count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export async function fetchTopProviders(): Promise<any[]> {
  const { data: providers, error } = await db
    .from('providers')
    .select('id, business_name, top_placement_until, boost_until')
    .gte('top_placement_until', new Date().toISOString())
    .eq('is_available', true)
    .order('top_placement_until', { ascending: false })
    .limit(5);

  if (error || !providers || (providers as any[]).length === 0) return [];

  const providerIds = (providers as any[]).map((p: any) => p.id);

  const { data: profiles } = await db
    .from('profiles')
    .select('id, avatar_url, full_name, lga_id, is_verified')
    .in('id', providerIds);

  const { data: lgas } = await db
    .from('lga_centers')
    .select('lga_id, lga_name, state_name');

  const profilesList = (profiles || []) as any[];
  const lgasList = (lgas || []) as any[];

  const lgaMap = new Map<number, { lga_name: string; state_name: string }>();
  lgasList.forEach((l: any) => {
    if (l.lga_id != null) {
      lgaMap.set(l.lga_id, { lga_name: l.lga_name, state_name: l.state_name });
    }
  });

  const profileMap = new Map<string, any>();
  profilesList.forEach((p: any) => profileMap.set(p.id, p));

  return (providers as any[]).map((provider: any) => {
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
}