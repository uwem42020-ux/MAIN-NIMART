// src/components/common/MobileCategoryList.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { TIERS, CATEGORIES, SUBCATEGORIES } from '../../data/categories';
import { cn } from '../../lib/utils';

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

interface MobileCategoryListProps {
  providerCounts: Record<string, number>;
  subcategoryCounts: Record<number, number>;
}

export function MobileCategoryList({ providerCounts, subcategoryCounts }: MobileCategoryListProps) {
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const getTierCount = (tierSlug: string) => {
    const cats = CATEGORIES.filter(c => c.tier_slug === tierSlug);
    return cats.reduce((sum, cat) => sum + (providerCounts[cat.slug] || 0), 0);
  };

  const pluralProvider = (count: number) =>
    `${count} provider${count !== 1 ? 's' : ''}`;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
      {TIERS.map(tier => {
        const isTierOpen = expandedTier === tier.slug;
        const tierCategories = CATEGORIES.filter(c => c.tier_slug === tier.slug);
        const tierCount = getTierCount(tier.slug);

        return (
          <div key={tier.slug}>
            {/* Tier header – toggles expand */}
            <button
              onClick={() => setExpandedTier(isTierOpen ? null : tier.slug)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3">
                <img src={tierIconMap[tier.slug]} alt={tier.name} className="w-8 h-8 object-contain" />
                <div>
                  <span className="text-sm font-medium text-gray-900">{tier.name}</span>
                  <p className="text-xs text-gray-500">{pluralProvider(tierCount)}</p>
                </div>
              </div>
              {isTierOpen ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {/* Expanded: categories & subs */}
            {isTierOpen && (
              <div className="bg-gray-50 border-t border-gray-100">
                {tierCategories.map(cat => {
                  const catCount = providerCounts[cat.slug] || 0;
                  const isCatOpen = expandedCategory === cat.slug;
                  const subs = SUBCATEGORIES.filter(s => s.category_slug === cat.slug);

                  return (
                    <div key={cat.slug}>
                      {/* Category row – link to search, also toggles subs */}
                      <div className="flex items-stretch">
                        <Link
                          to={`/search?category=${cat.slug}`}
                          className="flex-1 flex items-center justify-between px-6 py-2.5 text-sm text-gray-700 hover:bg-white"
                        >
                          <span>{cat.name}</span>
                          <span className="text-xs text-gray-400">{pluralProvider(catCount)}</span>
                        </Link>
                        {subs.length > 0 && (
                          <button
                            onClick={() => setExpandedCategory(isCatOpen ? null : cat.slug)}
                            className="px-3 flex items-center justify-center text-gray-400 hover:text-gray-600"
                          >
                            {isCatOpen ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Subcategories */}
                      {isCatOpen && subs.length > 0 && (
                        <div className="pl-8 bg-white border-t border-gray-100">
                          {subs.map(sub => (
                            <Link
                              key={sub.id}
                              to={`/search?subcategory=${sub.id}`}
                              className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                            >
                              <span>{sub.name}</span>
                              <span className="text-xs text-gray-400">
                                {pluralProvider(subcategoryCounts[sub.id] || 0)}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}