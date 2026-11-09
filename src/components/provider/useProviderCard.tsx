// src/components/provider/useProviderCard.ts
'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { formatDistance } from '@/lib/distance';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationStore } from '@/stores/locationStore';
import { fetchProviderProfile } from '@/lib/queries';
import type { Database } from '@/types/database';

type ProviderRow = Database['public']['Tables']['providers']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type PortfolioImageRow = Database['public']['Tables']['portfolio_images']['Row'];

export interface ProviderWithProfile extends ProviderRow {
  profile: ProfileRow | null;
  portfolio_images: PortfolioImageRow[];
  distance?: number;
  starting_price?: number;
  average_rating?: number;
  review_count?: number;
  lastSignInAt?: string | null;
}

export const statusIconMap: Record<string, string> = {
  available: '/active.svg',
  busy: '/busy.svg',
  away: '/away.svg',
};

export const statusLabel: Record<string, string> = {
  available: 'Available',
  busy: 'Busy',
  away: 'Away',
};

export const statusPillColor: Record<string, string> = {
  available: 'bg-green-100',
  busy: 'bg-yellow-100',
  away: 'bg-red-100',
};

// NOTE: portfolio_images column is `image_url`, NOT `url` or `storage_path`.
export function getOptimizedUrl(
  url: string | null | undefined,
  width: number = 400,
  height?: number
): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/')) return url;
  const h = height ?? width;
  // Safe string append — Supabase public URLs have no query string.
  return `${url}?width=${width}&height=${h}&quality=55&resize=cover`;
}

/**
 * Resolves the best image source for a provider card.
 * Chain: avatar → first portfolio image → /profile.png
 */
export function getProviderImageSrc(
  provider: ProviderWithProfile,
  width: number = 400,
  height?: number
): string {
  return (
    getOptimizedUrl(provider.profile?.avatar_url, width, height) ??
    getOptimizedUrl(provider.portfolio_images?.[0]?.image_url, width, height) ??
    '/profile.png'
  );
}

export function getCategoryDisplay(slug: string | null | undefined): string {
  if (!slug) return 'General Services';
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Category link — Bug 6 fix.
 * Returns a safe href even when selected_category_slug is null.
 */
export function getCategoryHref(slug: string | null | undefined): string {
  return slug ? `/search?category=${encodeURIComponent(slug)}` : '/search';
}

export function useProviderCard(provider: ProviderWithProfile) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { permissionGranted, setLocation } = useLocationStore();

  const isBoosted = provider.boost_until
    ? new Date(provider.boost_until) > new Date()
    : false;

  const isVerified = provider.profile?.is_verified ?? false;

  const categoryDisplay = getCategoryDisplay(provider.selected_category_slug);
  const categoryHref = getCategoryHref(provider.selected_category_slug);

  const lastSeen = provider.lastSignInAt
    ? formatDistanceToNow(new Date(provider.lastSignInAt), { addSuffix: true })
    : provider.profile?.updated_at
    ? formatDistanceToNow(new Date(provider.profile.updated_at), { addSuffix: true })
    : 'Recently';

  const displayName =
    provider.business_name || provider.profile?.full_name || 'Unnamed Provider';

  const handleBookNow = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (provider.status === 'away') return;
      if (!user) {
        toast.error('Please sign in to book');
        router.push('/auth/signin');
        return;
      }
      router.push(`/provider/${provider.id}?book=true`);
    },
    [provider.status, provider.id, user, router]
  );

  /**
   * Bug 8 fix — GPS enable loop.
   */
  const handleEnableLocation = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!navigator.geolocation) {
        toast.error('Geolocation not supported');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation(pos.coords.latitude, pos.coords.longitude);
          toast.success('Location enabled! Refreshing...');
          setTimeout(() => window.location.reload(), 500);
        },
        () => toast.error('Location permission denied')
      );
    },
    [setLocation]
  );

  const handleMouseEnter = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['provider', provider.id],
      queryFn: () => fetchProviderProfile(provider.id),
      staleTime: 1000 * 60 * 2,
    });
  }, [queryClient, provider.id]);

  /**
   * Shared distance renderer.
   */
  const renderDistance = useCallback(() => {
    if (provider.distance !== undefined) {
      return (
        <span className="text-xs font-medium text-gray-700">
          {formatDistance(provider.distance)}
        </span>
      );
    }
    if (!permissionGranted) {
      return (
        <button
          onClick={handleEnableLocation}
          className="text-xs text-primary-600 hover:underline"
        >
          📍 Enable location
        </button>
      );
    }
    return null;
  }, [provider.distance, permissionGranted, handleEnableLocation]);

  return {
    isBoosted,
    isVerified,
    categoryDisplay,
    categoryHref,
    lastSeen,
    displayName,
    handleBookNow,
    handleEnableLocation,
    handleMouseEnter,
    renderDistance,
  };
}