// src/components/map/ProviderMapCard.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Star, Calendar, Briefcase, Clock } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { calculateDistance, formatDistance } from '@/lib/distance';
import type { Database } from '@/types/database';

type ProviderRow = Database['public']['Tables']['providers']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

interface ProviderMapCardProps {
  provider: ProviderRow & { profile: ProfileRow | null };
  distance?: number;
  averageRating?: number;
  reviewCount?: number;
  lastSignIn?: string;
  onClose?: () => void;
  compact?: boolean;
}

export function ProviderMapCard({
  provider,
  distance,
  averageRating = 0,
  reviewCount = 0,
  lastSignIn,
  onClose,
  compact = false,
}: ProviderMapCardProps) {
  const router = useRouter();

  const locationString = provider.profile?.lga_name
    ? `${provider.profile.lga_name}, ${provider.profile.state_name || ''}`
    : 'Location not set';

  const categoryDisplay = provider.selected_category_slug
    ? provider.selected_category_slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'General Services';

  if (compact) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ width: 280 }}>
        <div className="flex p-4 gap-3">
          <Link href={`/provider/${provider.id}`} className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
              {provider.profile?.avatar_url ? (
                <OptimizedImage
                  src={provider.profile.avatar_url}
                  alt={provider.business_name || provider.profile.full_name || 'Provider'}
                  className="w-full h-full object-cover"
                  width={64}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-primary-600 bg-primary-50">
                  {(provider.business_name || provider.profile?.full_name || 'P')[0]}
                </div>
              )}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/provider/${provider.id}`} className="font-semibold text-sm text-primary-600 hover:underline line-clamp-1">
              {provider.business_name || provider.profile?.full_name || 'Unnamed'}
            </Link>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{locationString}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {averageRating > 0 && (
                <span className="flex items-center gap-0.5 text-xs">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  {averageRating.toFixed(1)}
                </span>
              )}
              {distance !== undefined && (
                <span className="text-xs font-medium text-gray-700">{formatDistance(distance)}</span>
              )}
            </div>
            <button
              onClick={() => router.push(`/provider/${provider.id}?book=true`)}
              className="mt-2 w-full bg-primary-600 text-white text-xs font-medium py-1.5 rounded-md hover:bg-primary-700 transition-colors"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ width: 300 }}>
      <Link href={`/provider/${provider.id}`} className="block">
        <div className="h-32 bg-gray-100">
          {provider.profile?.avatar_url ? (
            <OptimizedImage
              src={provider.profile.avatar_url}
              alt={provider.business_name || provider.profile.full_name || 'Provider'}
              className="w-full h-full object-cover"
              width={400}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-primary-600 bg-primary-50">
              {(provider.business_name || provider.profile?.full_name || 'P')[0]}
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/provider/${provider.id}`} className="font-semibold text-gray-900 hover:underline">
          {provider.business_name || provider.profile?.full_name || 'Unnamed'}
        </Link>
        {provider.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mt-1">{provider.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-600">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{locationString}</span>
          {averageRating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
              {averageRating.toFixed(1)} ({reviewCount})
            </span>
          )}
          <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{categoryDisplay}</span>
          {distance !== undefined && (
            <span className="font-medium text-gray-700">{formatDistance(distance)}</span>
          )}
        </div>
        <button
          onClick={() => router.push(`/provider/${provider.id}?book=true`)}
          className="mt-3 w-full bg-primary-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}