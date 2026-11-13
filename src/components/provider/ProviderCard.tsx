// src/components/provider/ProviderCard.tsx
'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import { MapPin, Star, Briefcase, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FavoriteButton } from '@/components/common/FavoriteButton';
import {
  useProviderCard,
  getProviderImageSrc,
  statusIconMap,
  statusLabel,
  statusPillColor,
  type ProviderWithProfile,
} from './useProviderCard';

interface ProviderCardProps {
  provider: ProviderWithProfile;
  className?: string;
  variant?: 'portrait' | 'horizontal';
  imageLoading?: 'lazy' | 'eager';
}

/**
 * Unified provider card.
 * variant="portrait"   → grid column card (mobile 2-col, image dominant)
 * variant="horizontal" → list-row card (image left, details right)
 */
export const ProviderCard = memo(function ProviderCard({
  provider,
  className,
  variant = 'portrait',
  imageLoading = 'lazy',
}: ProviderCardProps) {
  const {
    isBoosted,
    isVerified,
    categoryDisplay,
    categoryHref,
    lastSeen,
    displayName,
    handleBookNow,
    handleMouseEnter,
    renderDistance,
  } = useProviderCard(provider);

  const statusIcon = statusIconMap[provider.status] ?? '/active.svg';
  const statusText = statusLabel[provider.status] ?? provider.status;
  const statusPill = statusPillColor[provider.status] ?? 'bg-gray-100';

  // Price — shown as "Starting from ₦X" when available
  const hasPrice =
    typeof provider.starting_price === 'number' && provider.starting_price > 0;

  // Portrait uses the original height (passing undefined), horizontal uses a square.
  const imageSrc =
    variant === 'portrait'
      ? getProviderImageSrc(provider, 400, undefined) 
      : getProviderImageSrc(provider, 400, 400);

  const isPortrait = variant === 'portrait';
  
  // 🔥 State to track if the image has finished loading
  const [isImgLoaded, setIsImgLoaded] = useState(false);

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm overflow-hidden flex break-inside-avoid',
        isPortrait
          ? 'flex-col w-full border border-gray-100'
          : 'flex-row w-full border border-gray-100 hover:shadow-md transition-shadow',
        isBoosted && 'border-2 border-amber-500',
        isVerified && !isBoosted && 'border-2 border-primary-500',
        className
      )}
    >
      {/* ================= IMAGE + LINK WRAPPER ================= */}
      <div
        className={cn(
          'relative bg-gray-200 overflow-hidden flex-shrink-0',
          // Made horizontal image larger for desktop
          // 🔥 FIX: Added aspect-[4/5] to isPortrait to prevent layout shift (CLS)
          isPortrait ? 'w-full aspect-[4/5]' : 'w-32 sm:w-40 md:w-48 aspect-square'
        )}
      >
        <Link
          href={`/provider/${provider.id}`}
          onMouseEnter={handleMouseEnter}
          className={cn(
            'block',
            isPortrait ? 'relative w-full' : 'absolute inset-0'
          )}
          aria-label={`View ${displayName}`}
        >
          {!isImgLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse z-0" />
          )}
          
          <img
            src={imageSrc}
            alt={displayName}
            className={cn(
              isPortrait 
                ? 'w-full h-auto block' 
                : 'absolute inset-0 w-full h-full object-cover object-top',
              'transition-opacity duration-500 ease-in-out z-10 relative',
              isImgLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setIsImgLoaded(true)}
            loading={imageLoading}
            {...(imageLoading === 'eager' ? { fetchPriority: 'high' as const } : {})}
            onError={(e) => {
              e.currentTarget.src = '/profile.png';
              setIsImgLoaded(true);
            }}
          />
        </Link>

        <div className="absolute top-2 left-2 z-20">
          <FavoriteButton providerId={provider.id} size="sm" />
        </div>

        {isVerified && (
          <div className="absolute top-2 right-2 bg-white rounded-full p-0.5 shadow-sm z-20 pointer-events-none">
            <img
              src="/verify.png"
              alt="Verified"
              className={isPortrait ? 'h-7 w-7' : 'h-6 w-6'}
            />
          </div>
        )}

        {isBoosted && (
          <div
            className={cn(
              'absolute left-0 bg-amber-500 text-white rounded-r-md shadow-md z-20',
              isPortrait ? 'bottom-3 px-2 py-2' : 'bottom-2 px-1.5 py-1.5'
            )}
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            <span
              className={cn(
                'font-black tracking-wide',
                isPortrait ? 'text-sm' : 'text-[10px]'
              )}
            >
              BOOSTED
            </span>
          </div>
        )}
      </div>

      {/* ================= DETAILS ================= */}
      <div
        className={cn(
          'flex flex-col flex-1 min-w-0',
          isPortrait ? 'p-2 sm:p-4' : 'p-4 sm:p-5 justify-between'
        )}
      >
        {/* Name + status */}
        <div className="flex items-center gap-1.5 mb-1">
          <div
            className={cn('flex-shrink-0 rounded-full p-0.5', statusPill)}
            title={statusText}
          >
            <img src={statusIcon} alt={statusText} className="h-3 w-3" />
          </div>
          <Link
            href={`/provider/${provider.id}`}
            onMouseEnter={handleMouseEnter}
            className={cn(
              'font-semibold text-primary-600 hover:underline flex-1',
              isPortrait ? 'line-clamp-2 text-sm leading-tight' : 'truncate text-base'
            )}
          >
            {displayName}
          </Link>
        </div>

        {/* Description */}
        {provider.description && (
          <p
            className={cn(
              'text-xs text-gray-600',
              isPortrait ? 'line-clamp-2 mb-2' : 'line-clamp-2 mt-1'
            )}
          >
            {provider.description}
          </p>
        )}

        {/* Category pill */}
        <div className={isPortrait ? 'mb-2 mt-1' : 'mt-2'}>
          <Link
            href={categoryHref}
            className="inline-flex items-center gap-1 bg-primary-600 text-white text-xs px-2.5 py-0.5 rounded-full hover:bg-primary-700 transition"
            onClick={(e) => e.stopPropagation()}
          >
            <Briefcase className="h-3 w-3" />
            <span>{categoryDisplay}</span>
          </Link>
        </div>

        {/* Location */}
        {isPortrait ? (
          <div className="flex items-start text-xs text-gray-600 mb-1 mt-1">
            <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="line-clamp-1">
                {provider.profile?.lga_name || 'LGA not set'}
              </span>
              {provider.profile?.state_name && (
                <div className="text-[11px] sm:text-xs font-semibold text-primary-600 truncate">
                  {provider.profile.state_name}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs">
            <span className="flex items-center gap-1 text-gray-600">
              <MapPin className="h-3.5 w-3.5" />
              {provider.profile?.lga_name
                ? `${provider.profile.lga_name}${
                    provider.profile.state_name
                      ? `, ${provider.profile.state_name}`
                      : ''
                  }`
                : 'Location not set'}
            </span>
          </div>
        )}

        {/* Last seen */}
        <div
          className={cn(
            'flex items-center text-xs text-gray-500',
            isPortrait ? 'mb-2' : 'mt-2'
          )}
        >
          <Clock className="h-3 w-3 mr-1" />
          <span>
            {isPortrait ? 'Last seen ' : ''}
            {lastSeen}
          </span>
        </div>

        {/* Rating + distance row */}
        <div
          className={cn(
            'flex items-center justify-between',
            isPortrait ? 'mb-2 mt-auto' : 'mt-3'
          )}
        >
          {renderDistance()}
          {provider.average_rating !== undefined && provider.average_rating > 0 ? (
            <div className="flex items-center">
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 mr-0.5" />
              <span className="text-xs font-medium text-gray-700">
                {provider.average_rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400 ml-0.5">
                ({provider.review_count ?? 0})
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">No reviews</span>
          )}
        </div>

        {/* ===== Price & Book Now (Flex-Row for horizontal) ===== */}
        <div className={cn(
          "border-t border-gray-100 pt-3 mt-3 flex",
          isPortrait ? "flex-col gap-2" : "flex-row items-center justify-between gap-4"
        )}>
          <div>
            {hasPrice ? (
              <>
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Starting from
                </div>
                <div
                  className={cn(
                    'font-extrabold text-gray-900',
                    isPortrait ? 'text-lg' : 'text-xl'
                  )}
                >
                  ₦{provider.starting_price!.toLocaleString()}
                </div>
              </>
            ) : (
              <div
                className={cn(
                  'font-semibold text-gray-500',
                  isPortrait ? 'text-sm' : 'text-sm'
                )}
              >
                Contact for pricing
              </div>
            )}
          </div>

          {/* Book Now Button */}
          <button
            onClick={handleBookNow}
            disabled={provider.status === 'away'}
            className={cn(
              'text-center font-medium rounded-lg transition-colors',
              isPortrait ? 'w-full py-2 text-sm' : 'px-6 py-2 text-sm w-max',
              provider.status === 'away'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            )}
          >
            {provider.status === 'away' ? 'Not Available' : 'Book Now'}
          </button>
        </div>
      </div>
    </div>
  );
});