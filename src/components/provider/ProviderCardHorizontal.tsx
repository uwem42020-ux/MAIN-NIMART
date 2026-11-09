// src/components/provider/ProviderCardHorizontal.tsx
'use client';

import { memo } from 'react';
import { ProviderCard } from './ProviderCard';
import type { ProviderWithProfile } from './useProviderCard';

export type { ProviderWithProfile } from './useProviderCard';

interface ProviderCardHorizontalProps {
  provider: ProviderWithProfile;
  className?: string;
}

/**
 * Thin wrapper — kept for backward compatibility with existing imports.
 * Renders ProviderCard with variant="horizontal".
 */
export const ProviderCardHorizontal = memo(function ProviderCardHorizontal({
  provider,
  className,
}: ProviderCardHorizontalProps) {
  return (
    <ProviderCard
      provider={provider}
      variant="horizontal"
      className={className}
    />
  );
});