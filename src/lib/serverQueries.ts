// lib/serverQueries.ts
import { db } from '@/lib/supabase-any';
import type { ProviderWithProfile } from '@/components/provider/ProviderCardPortrait';

export async function fetchInitialProviders(): Promise<ProviderWithProfile[]> {
  const { data, error } = await db.rpc('get_featured_providers', { limit_count: 50 } as any);
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
    lastSignInAt: null,
  })) as unknown as ProviderWithProfile[];
}

export async function fetchSearchProviders(searchParams: {
  q?: string;
  tier?: string;
  category?: string;
  subcategory?: string;
  state?: string;
  lga?: string;
}): Promise<ProviderWithProfile[]> {
  const { data, error } = await db.rpc('get_featured_providers', { limit_count: 50 } as any);
  if (error || !data) return [];

  const providers: any[] = Array.isArray(data) ? data : [];

  let filtered = providers;
  const { q, tier, category, subcategory, state, lga } = searchParams;

  if (q) {
    const pattern = q.toLowerCase();
    filtered = filtered.filter(p =>
      (p.business_name && p.business_name.toLowerCase().includes(pattern)) ||
      (p.description && p.description.toLowerCase().includes(pattern))
    );
  }

  if (tier) filtered = filtered.filter(p => p.selected_tier_slug === tier);
  if (category) filtered = filtered.filter(p => p.selected_category_slug === category);
  if (subcategory) filtered = filtered.filter(p => p.selected_subcategory_id === parseInt(subcategory));

  if (lga) {
    const lgaNum = parseInt(lga);
    filtered = filtered.filter(p => p.profile?.lga_id === lgaNum);
  } else if (state) {
    // state can be an ID (number) or a name (e.g. "FCT")
    let stateId: number | null = null;
    const parsed = parseInt(state);
    if (!isNaN(parsed)) {
      stateId = parsed;
    } else {
      // look up state ID by name
      const { data: stateData } = await db
        .from('lga_centers')
        .select('state_id')
        .eq('state_name', state)
        .limit(1);
      if (stateData && (stateData as any[]).length > 0) {
        stateId = (stateData as any[])[0].state_id;
      }
    }

    if (stateId !== null) {
      const { data: lgasInState } = await db
        .from('lga_centers')
        .select('lga_id')
        .eq('state_id', stateId);

      if (lgasInState?.length) {
        const lgaIds = (lgasInState as any[]).map(l => l.lga_id);
        filtered = filtered.filter(p => lgaIds.includes(p.profile?.lga_id));
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  return filtered.slice(0, 50).map(item => ({
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
    lastSignInAt: null,
  })) as unknown as ProviderWithProfile[];
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