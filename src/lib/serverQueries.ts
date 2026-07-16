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

  // Keyword filter
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

  // LGA filter
  if (lga) {
    const lgaNum = parseInt(lga);
    filtered = filtered.filter(p => p.profile?.lga_id === lgaNum);
  } else if (state) {
    const { data: lgasInState } = await db
      .from('lga_centers')
      .select('lga_id')
      .eq('state_id', parseInt(state));

    if (lgasInState?.length) {
      const lgaIds = (lgasInState as any[]).map(l => l.lga_id);
      filtered = filtered.filter(p => lgaIds.includes(p.profile?.lga_id));
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