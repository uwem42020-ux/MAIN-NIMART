// src/components/provider/ProviderCardPortrait.tsx
'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Star, Briefcase, Clock } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { formatDistance } from '@/lib/distance';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationStore } from '@/stores/locationStore';
import toast from 'react-hot-toast';
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

interface ProviderCardPortraitProps {
  provider: ProviderWithProfile;
  className?: string;
  /** Use "eager" for the first card (LCP) – overrides default "lazy" */
  imageLoading?: 'lazy' | 'eager';
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

export const ProviderCardPortrait = memo(function ProviderCardPortrait({
  provider,
  className,
  imageLoading = 'lazy',
}: ProviderCardPortraitProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { permissionGranted, setPermissionDenied } = useLocationStore();
  const queryClient = useQueryClient();

  const isBoosted = provider.boost_until ? new Date(provider.boost_until) > new Date() : false;
  const isVerified = provider.profile?.is_verified || false;

  const handleBookNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (provider.status === 'away') return;
    if (!user) {
      toast.error('Please sign in to book');
      router.push('/auth/signin');
      return;
    }
    router.push(`/provider/${provider.id}?book=true`);
  };

  const handleEnableLocation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPermissionDenied(false);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          toast.success('Location enabled! Refreshing...');
          setTimeout(() => window.location.reload(), 500);
        },
        () => toast.error('Location permission denied')
      );
    } else {
      toast.error('Geolocation not supported');
    }
  };

  const renderDistance = () => {
    if (provider.distance !== undefined) {
      return (
        <span className="text-xs font-medium text-gray-700">
          {formatDistance(provider.distance)}
        </span>
      );
    }
    if (!permissionGranted) {
      return (
        <button onClick={handleEnableLocation} className="text-xs text-primary-600 hover:underline">
          📍 Enable location
        </button>
      );
    }
    return null;
  };

  const handleMouseEnter = () => {
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'prefetch';
    preloadLink.href = `/provider/${provider.id}`;
    document.head.appendChild(preloadLink);

    // Corrected: prefetch the Next.js App Router page
    import('@/app/provider/[id]/page').catch(() => {});

    queryClient.prefetchQuery({
      queryKey: ['provider', provider.id],
      queryFn: () => fetchProviderProfile(provider.id),
      staleTime: 1000 * 60 * 2,
    });
  };

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

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm overflow-hidden flex flex-col break-inside-avoid max-w-[280px] mx-auto',
        !isBoosted && !isVerified && 'border border-gray-100',
        isBoosted && 'border-2 border-amber-500',
        isVerified && !isBoosted && 'border-2 border-primary-500',
        className
      )}
    >
      <Link
        href={`/provider/${provider.id}`}
        onMouseEnter={handleMouseEnter}
        className="block relative w-full bg-gray-100"
      >
        <div className="relative overflow-hidden bg-gray-200 w-full aspect-[4/5]">
          {provider.profile?.avatar_url ? (
            <OptimizedImage
              src={provider.profile.avatar_url}
              alt={provider.business_name || provider.profile.full_name || 'Provider'}
              className="w-full h-full object-cover"
              width={400}
              height={500}
              loading={imageLoading}
              fetchpriority={imageLoading === 'eager' ? 'high' : 'auto'}
            />
          ) : (
            <img
              src="/profile.png"
              alt="Placeholder"
              className="w-full h-full object-cover"
              width={400}
              height={500}
            />
          )}
        </div>

        <div className="absolute top-2 left-2 z-10">
          <FavoriteButton providerId={provider.id} size="sm" />
        </div>

        {isVerified && (
          <div className="absolute top-3 right-3 bg-white rounded-full p-0.5 shadow-sm z-10">
            <img src="/verify.png" alt="Verified" className="h-7 w-7" />
          </div>
        )}

        {isBoosted && (
          <div
            className="absolute bottom-3 left-0 bg-amber-500 text-white rounded-r-md px-2 py-2 shadow-md z-10"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            <span className="text-sm font-black tracking-wide">BOOSTED</span>
          </div>
        )}
      </Link>

      <div className="p-3 sm:p-4 flex flex-col flex-1">
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
          <Link href={`/provider/${provider.id}`} className="block flex-1">
            <h3 className="font-semibold text-primary-600 line-clamp-2 hover:underline text-sm leading-tight">
              {provider.business_name || provider.profile?.full_name || 'Unnamed Provider'}
            </h3>
          </Link>
        </div>

        {provider.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">{provider.description}</p>
        )}

        <div className="mb-2">
          <Link
            href={`/search?category=${provider.selected_category_slug}`}
            className="inline-flex items-center gap-1 bg-primary-600 text-white text-xs px-2.5 py-0.5 rounded-full hover:bg-primary-700 transition"
            onClick={(e) => e.stopPropagation()}
          >
            <Briefcase className="h-3 w-3" />
            <span>{categoryDisplay}</span>
          </Link>
        </div>

        <div className="flex items-start text-xs text-gray-600 mb-1">
          <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="line-clamp-1">{provider.profile?.lga_name || 'LGA not set'}</span>
            {provider.profile?.state_name && (
              <div className="text-[11px] sm:text-xs font-semibold text-primary-600 truncate">
                {provider.profile.state_name}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center text-xs text-gray-500 mb-2">
          <Clock className="h-3 w-3 mr-1" />
          <span>Last seen {lastSeen}</span>
        </div>

        <div className="flex items-center justify-between mb-3 mt-auto">
          {renderDistance()}
          {provider.average_rating !== undefined && provider.average_rating > 0 ? (
            <div className="flex items-center">
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 mr-0.5" />
              <span className="text-xs font-medium text-gray-700">
                {provider.average_rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400 ml-0.5">({provider.review_count || 0})</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">No reviews</span>
          )}
        </div>

        {provider.status === 'away' ? (
          <button disabled className="w-full bg-gray-300 text-gray-500 text-sm font-medium py-2 rounded-lg cursor-not-allowed">
            Not Available
          </button>
        ) : (
          <button
            onClick={handleBookNow}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 rounded-lg transition-colors text-center"
          >
            Book Now
          </button>
        )}
      </div>
    </div>
  );
});