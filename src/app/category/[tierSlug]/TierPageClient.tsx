// src/app/category/[tierSlug]/TierPageClient.tsx
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { TIERS, CATEGORIES, SUBCATEGORIES } from '@/data/categories';
import { useState } from 'react';

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

interface TierPageClientProps {
  tierSlug: string;
}

export function TierPageClient({ tierSlug }: TierPageClientProps) {
  const router = useRouter();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const currentTier = TIERS.find(t => t.slug === tierSlug);
  const categories = tierSlug
    ? CATEGORIES.filter(c => c.tier_slug === tierSlug)
    : [];

  if (!currentTier) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Category not found.</p>
        <Link href="/" className="mt-4 inline-block text-primary-600 hover:underline">
          Go back home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <img
            src={tierIconMap[currentTier.slug]}
            alt={currentTier.name}
            className="w-8 h-8 object-contain"
          />
          <h1 className="text-xl font-bold text-gray-900">{currentTier.name} Services</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border divide-y">
        {categories.map(cat => {
          const isExpanded = expandedCategory === cat.slug;
          const subcategories = SUBCATEGORIES.filter(s => s.category_slug === cat.slug);

          return (
            <div key={cat.slug}>
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : cat.slug)}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{cat.name}</span>
                {subcategories.length > 0 && (
                  <ChevronRight
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                )}
              </button>

              {isExpanded && subcategories.length > 0 && (
                <div className="bg-gray-50 border-t">
                  {subcategories.map(sub => (
                    <Link
                      key={sub.id}
                      href={`/search?subcategory=${sub.id}`}
                      className="block px-6 py-3 text-gray-700 hover:bg-gray-100 border-b last:border-0"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <Link
          href={`/search?tier=${tierSlug}`}
          className="block w-full text-center bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700"
        >
          View All in {currentTier.name}
        </Link>
      </div>
    </div>
  );
}