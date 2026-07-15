// src/components/common/CategoryButtons.tsx
'use client';

import { useState } from 'react';
import { TIERS, CATEGORIES } from '@/data/categories';
import { MobileCategoryPanel } from './MobileCategoryPanel';

const tierIconMap: Record<string, string> = {
  automotive: '/categoryicons/roadside.png',
  'home-property': '/categoryicons/home.png',
  emergency: '/categoryicons/safety.png',
  professional: '/categoryicons/services.png',
  technology: '/categoryicons/technology.png',
  beauty: '/categoryicons/beauty.png',
  food: '/categoryicons/food.png',
  events: '/categoryicons/event.png',
  education: '/categoryicons/education.png',
  health: '/categoryicons/health.png',
  logistics: '/categoryicons/logistics.png',
  social: '/categoryicons/social.png',
  'business-partners': '/categoryicons/partner&support.png',
  trade: '/categoryicons/export.png',
};

interface CategoryButtonsProps {
  providerCounts: Record<string, number>;
  subcategoryCounts: Record<number, number>;
}

export function CategoryButtons({ providerCounts, subcategoryCounts }: CategoryButtonsProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const getTierCount = (tierSlug: string) => {
    const cats = CATEGORIES.filter(c => c.tier_slug === tierSlug);
    return cats.reduce((sum, cat) => sum + (providerCounts[cat.slug] || 0), 0);
  };

  const pluralProvider = (count: number) =>
    `${count} provider${count !== 1 ? 's' : ''}`;

  const selectedTierName = selectedTier
    ? TIERS.find(t => t.slug === selectedTier)?.name || ''
    : '';

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {TIERS.map(tier => {
          const count = getTierCount(tier.slug);
          return (
            <button
              key={tier.slug}
              onClick={() => setSelectedTier(tier.slug)}
              className="flex flex-col items-center justify-center p-2 group"
            >
              <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-1 group-hover:bg-primary-100 transition-colors">
                <img
                  src={tierIconMap[tier.slug]}
                  alt={tier.name}
                  className="w-10 h-10 object-contain"
                  width={40}
                  height={40}
                />
              </div>
              <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">
                {tier.name}
              </span>
              <span className="text-xs text-gray-400">{pluralProvider(count)}</span>
            </button>
          );
        })}
      </div>

      {selectedTier && (
        <MobileCategoryPanel
          tierSlug={selectedTier}
          tierName={selectedTierName}
          tierIcon={selectedTier ? tierIconMap[selectedTier] : ''}
          providerCounts={providerCounts}
          subcategoryCounts={subcategoryCounts}
          onClose={() => setSelectedTier(null)}
        />
      )}
    </>
  );
}