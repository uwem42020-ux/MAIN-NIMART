// src/lib/queries.ts
import { supabase } from './supabase';

export async function fetchProviderProfile(id: string) {
  const { data: providerData, error: providerError } = await supabase
    .from('providers')
    .select('*')
    .eq('id', id)
    .single();
  if (providerError) throw providerError;
  if (!providerData) throw new Error('Provider not found');

  const [
    { data: profileData },
    { data: portfolioImages },
    { data: reviews },
    { data: services },
    { data: completedData },
    { data: lastSignInData },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('portfolio_images').select('*').eq('provider_id', id).order('created_at', { ascending: false }),
    supabase.from('reviews').select('id, rating, content, created_at, reviewer:reviewer_id(full_name, avatar_url)').eq('provider_id', id).order('created_at', { ascending: false }),
    supabase.from('provider_services').select('*').eq('provider_id', id).order('created_at', { ascending: true }),
    supabase.rpc('get_provider_completed_bookings', { provider_id: id }),
    supabase.rpc('get_user_last_sign_in', { user_id: id }),
  ]);

  return {
    ...providerData,
    profile: profileData ?? null,
    portfolio_images: portfolioImages ?? [],
    reviews: reviews ?? [],
    services: services ?? [],
    completedBookings: completedData ?? 0,
    lastSignInAt: lastSignInData,
    created_at: profileData?.created_at,
  };
}