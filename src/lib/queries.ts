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

  // 🔥 FIX: Destructure the full response objects to check for errors instead of silently ignoring them
  const [
    profileRes,
    portfolioRes,
    reviewsRes,
    servicesRes,
    completedRes,
    lastSignInRes,
  ] = await Promise.all([
    db.from('profiles').select('*').eq('id', id).single(),
    db.from('portfolio_images').select('*').eq('provider_id', id).order('created_at', { ascending: false }),
    db.from('reviews').select('id, rating, content, created_at, reviewer:reviewer_id(full_name, avatar_url)').eq('provider_id', id).order('created_at', { ascending: false }),
    db.from('provider_services').select('*').eq('provider_id', id).order('created_at', { ascending: true }),
    db.rpc('get_provider_completed_bookings', { provider_id: id } as any),
    db.rpc('get_user_last_sign_in', { user_id: id } as any),
  ]);

  // Log errors so they show up in your monitoring, but don't crash the whole profile page if a non-critical table fails
  if (profileRes.error) console.error('Profile fetch error:', profileRes.error);
  if (portfolioRes.error) console.error('Portfolio fetch error:', portfolioRes.error);
  if (reviewsRes.error) console.error('Reviews fetch error:', reviewsRes.error);
  if (servicesRes.error) console.error('Services fetch error:', servicesRes.error);
  if (completedRes.error) console.error('Completed bookings fetch error:', completedRes.error);
  if (lastSignInRes.error) console.error('Last sign in fetch error:', lastSignInRes.error);

  return {
    ...(providerData as any),
    profile: profileRes.data ?? null,
    portfolio_images: portfolioRes.data ?? [],
    reviews: reviewsRes.data ?? [],
    services: servicesRes.data ?? [],
    completedBookings: completedRes.data ?? 0,
    lastSignInAt: lastSignInRes.data,
    created_at: (profileRes.data as any)?.created_at,
  };
}