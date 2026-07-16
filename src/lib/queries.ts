// src/lib/queries.ts
import { db } from '@/lib/supabase-any';

export async function fetchProviderProfile(id: string) {
  const { data: providerData, error: providerError } = await db
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
    db.from('profiles').select('*').eq('id', id).single(),
    db.from('portfolio_images').select('*').eq('provider_id', id).order('created_at', { ascending: false }),
    db.from('reviews').select('id, rating, content, created_at, reviewer:reviewer_id(full_name, avatar_url)').eq('provider_id', id).order('created_at', { ascending: false }),
    db.from('provider_services').select('*').eq('provider_id', id).order('created_at', { ascending: true }),
    db.rpc('get_provider_completed_bookings', { provider_id: id } as any),
    db.rpc('get_user_last_sign_in', { user_id: id } as any),
  ]);

  return {
    ...(providerData as any),
    profile: profileData ?? null,
    portfolio_images: portfolioImages ?? [],
    reviews: reviews ?? [],
    services: services ?? [],
    completedBookings: completedData ?? 0,
    lastSignInAt: lastSignInData,
    created_at: (profileData as any)?.created_at,
  };
}