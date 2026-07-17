// src/components/provider/ProviderCardHorizontal.tsx
'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Star, Briefcase, Clock } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { formatDistance } from '@/lib/distance';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/types/database';
import { FavoriteButton } from '@/components/common/FavoriteButton';
import { useQueryClient } from '@tanstack/react-query';
import { fetchProviderProfile } from '@/lib/queries';

type ProviderRow = Database['public']['Tables']['providers']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type PortfolioImageRow = Database['public']['Tables']['portfolio_images']['Row'];

export interface ProviderWithProfile extends ProviderRow {
  profile: ProfileRow;
  portfolio_images: PortfolioImageRow[];
  distance?: number;
  average_rating?: number;
  review_count?: number;
  lastSignInAt?: string | null;
}

interface ProviderCardHorizontalProps {
  provider: ProviderWithProfile;
  className?: string;
}

const statusIconMap: Record<string, string> = {
  available: '/active.svg',
  busy: '/busy.svg',
  away: '/away.svg',
};

const statusLabel: Record<string, string> = {
  available: 'Available',
  busy: 'Busy',
  away: 'Away',
};

const statusRingColor: Record<string, string> = {
  available: 'bg-green-500',
  busy: 'bg-yellow-500',
  away: 'bg-red-500',
};

export const ProviderCardHorizontal = memo(function ProviderCardHorizontal({
  provider,
  className,
}: ProviderCardHorizontalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const locationString = provider.profile?.lga_name
    ? `${provider.profile.lga_name}${provider.profile?.state_name ? `, ${provider.profile.state_name}` : ''}`
    : 'Location not set';

  const categoryDisplay = provider.selected_category_slug
    ? provider.selected_category_slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'General Services';

  const lastSeen = provider.lastSignInAt
    ? formatDistanceToNow(new Date(provider.lastSignInAt), { addSuffix: true })
    : provider.profile?.updated_at
    ? formatDistanceToNow(new Date(provider.profile.updated_at), { addSuffix: true })
    : 'Recently';

  const isBoosted = provider.boost_until ? new Date(provider.boost_until) > new Date() : false;
  const isVerified = provider.profile?.is_verified || false;

  const handleBook = () => {
    if (provider.status === 'away') return;
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    router.push(`/provider/${provider.id}?book=true`);
  };

  // Prefetch route + data on hover
  const handleMouseEnter = () => {
    // Prefetch the route HTML
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'prefetch';
    preloadLink.href = `/provider/${provider.id}`;
    document.head.appendChild(preloadLink);

    // Prefetch profile data
    queryClient.prefetchQuery({
      queryKey: ['provider', provider.id],
      queryFn: () => fetchProviderProfile(provider.id),
      staleTime: 1000 * 60 * 2,
    });
  };

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-row items-stretch hover:shadow-md transition-shadow',
        isBoosted && 'border-2 border-amber-500',
        isVerified && !isBoosted && 'border-2 border-primary-500',
        className
      )}
    >
      {/* Image area */}
      <Link
        href={`/provider/${provider.id}`}
        onMouseEnter={handleMouseEnter}
        className="w-28 sm:w-32 flex-shrink-0 relative bg-gray-100 overflow-hidden"
      >
        {provider.profile?.avatar_url ? (
          <OptimizedImage
            src={provider.profile.avatar_url}
            alt={provider.business_name || provider.profile.full_name || 'Provider'}
            className="w-full h-full object-cover"
            width={128}
            height={128}
          />
        ) : (
          <div className="w-full h-full relative">
            <img
              src="/profile.png"
              alt="Placeholder"
              className="w-full h-full object-cover"
              width={128}
              height={128}
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        )}

        <div className="absolute top-2 left-2 z-10">
          <FavoriteButton providerId={provider.id} size="sm" />
        </div>

        {isVerified && (
          <div className="absolute top-2 right-2 bg-white rounded-full p-0.5 shadow-sm z-10">
            <img src="/verify.png" alt="Verified" className="h-6 w-6" />
          </div>
        )}

        {isBoosted && (
          <div
            className="absolute bottom-2 left-0 bg-amber-500 text-white rounded-r-md px-1.5 py-1.5 shadow-md z-10"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            <span className="text-[10px] font-black tracking-wide">BOOSTED</span>
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="relative flex-shrink-0">
            <span
              className={cn(
                'absolute w-5 h-5 -top-1 -left-1 rounded-full animate-ping opacity-75',
                statusRingColor[provider.status] || 'bg-gray-500'
              )}
              style={{ animationDuration: '1.1s' }}
            />
            <img
              src={statusIconMap[provider.status] || '/active.svg'}
              alt={provider.status}
              className="relative h-3 w-3 z-10"
              title={statusLabel[provider.status] || provider.status}
            />
          </div>
          <Link
            href={`/provider/${provider.id}`}
            className="font-semibold text-primary-600 truncate hover:underline flex-1"
          >
            {provider.business_name || provider.profile?.full_name || 'Unnamed Provider'}
          </Link>
        </div>

        {provider.description && (
          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{provider.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs">
          <span className="flex items-center gap-1 text-gray-600">
            <MapPin className="h-3.5 w-3.5" />
            {locationString}
          </span>
          {provider.average_rating !== undefined && provider.average_rating > 0 && (
            <span className="flex items-center gap-1 text-yellow-500">
              <Star className="h-3.5 w-3.5 fill-yellow-400" />
              {provider.average_rating.toFixed(1)} ({provider.review_count || 0})
            </span>
          )}
          <span className="flex items-center gap-1 text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            {lastSeen}
          </span>
          {provider.distance !== undefined && (
            <span className="flex items-center gap-1 text-gray-700 font-medium">
              <MapPin className="h-3.5 w-3.5 text-primary-600" />
              {formatDistance(provider.distance)}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <Link
            href={`/search?category=${provider.selected_category_slug}`}
            className="inline-flex items-center gap-1 bg-primary-600 text-white text-xs px-2.5 py-0.5 rounded-full hover:bg-primary-700 transition"
          >
            <Briefcase className="h-3 w-3" />
            <span>{categoryDisplay}</span>
          </Link>
          {provider.status === 'away' ? (
            <button
              disabled
              className="bg-gray-300 text-gray-500 text-xs px-3 py-1.5 rounded-md cursor-not-allowed"
            >
              Not Available
            </button>
          ) : (
            <button
              onClick={handleBook}
              className="bg-primary-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-primary-700 transition-colors"
            >
              Book Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
});