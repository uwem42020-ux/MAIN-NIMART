// src/components/provider/ProviderCardPortrait.tsx
'use client';

import { memo } from 'react';
import { ProviderCard } from './ProviderCard';
import type { ProviderWithProfile } from './useProviderCard';

export type { ProviderWithProfile } from './useProviderCard';
export { getOptimizedUrl } from './useProviderCard';

interface ProviderCardPortraitProps {
  provider: ProviderWithProfile;
  className?: string;
  imageLoading?: 'lazy' | 'eager';
}

/**
 * Thin wrapper — kept for backward compatibility with existing imports.
 * Renders ProviderCard with variant="portrait".
 */
export const ProviderCardPortrait = memo(function ProviderCardPortrait({
  provider,
  className,
  imageLoading = 'lazy',
}: ProviderCardPortraitProps) {
  return (
    <ProviderCard
      provider={provider}
      variant="portrait"
      className={className}
      imageLoading={imageLoading}
    />
  );
});