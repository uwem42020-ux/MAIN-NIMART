'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ProviderCardPortrait, type ProviderWithProfile } from '@/components/provider/ProviderCardPortrait';
import { ProviderCardHorizontal } from '@/components/provider/ProviderCardHorizontal';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Star,
  LayoutGrid,
  List,
  Users,
  Briefcase,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

interface CategoryLandingClientProps {
  categoryName: string;
  categorySlug: string;
  providers: ProviderWithProfile[];
  statesWithCount: { name: string; slug: string; count: number }[];
}

export default function CategoryLandingClient({
  categoryName,
  categorySlug,
  providers,
  statesWithCount,
}: CategoryLandingClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const totalProviders = providers.length;
  const avgRating = providers.length
    ? providers.reduce((sum, p) => sum + (p.average_rating || 0), 0) / providers.length
    : 0;

  // Subcategories count (if any)
  const subcategoryMap = new Map<string, number>();
  providers.forEach((p) => {
    if (p.selected_subcategory_id) {
      const key = p.selected_subcategory_id.toString();
      subcategoryMap.set(key, (subcategoryMap.get(key) || 0) + 1);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-700 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex items-center gap-2 text-sm text-primary-100 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/search" className="hover:text-white">Categories</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{categoryName}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {categoryName} Services in Nigeria
          </h1>
          <p className="text-primary-100 max-w-2xl text-base md:text-lg">
            Browse {totalProviders} verified {categoryName.toLowerCase()} professionals across Nigeria.
            Compare ratings, read reviews, and book trusted services on Nimart.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-8 max-w-md">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <p className="text-2xl font-bold">{totalProviders}</p>
              <p className="text-xs opacity-80">Providers</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <Briefcase className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <p className="text-2xl font-bold">{subcategoryMap.size}</p>
              <p className="text-xs opacity-80">Subcategories</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <Star className="h-6 w-6 mx-auto mb-2 fill-yellow-400 text-yellow-400" />
              <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
              <p className="text-xs opacity-80">Avg Rating</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* States with this category */}
        {statesWithCount.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {categoryName} by State
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {statesWithCount.map((state) => (
                <Link
                  key={state.slug}
                  href={`/categories/${categorySlug}/${state.slug}`}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-3 group-hover:bg-primary-100 transition">
                    <MapPin className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 truncate">{state.name}</h3>
                  <p className="text-xs text-primary-600 mt-1">{state.count} provider{state.count !== 1 ? 's' : ''}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Providers */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              All {categoryName} Providers
            </h2>
            <div className="flex gap-2">
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn('p-2', viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:text-primary-600')}
                  title="Grid view"
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn('p-2', viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:text-primary-600')}
                  title="List view"
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
              <Link
                href={`/search?category=${categorySlug}`}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
              >
                Search & Filter
              </Link>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {providers.map((provider) => (
                <ProviderCardPortrait key={provider.id} provider={provider} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {providers.map((provider) => (
                <ProviderCardHorizontal key={provider.id} provider={provider} />
              ))}
            </div>
          )}
        </section>

        {/* FAQ */}
        <section className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary-600" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-gray-900">How do I find a reliable {categoryName.toLowerCase()} provider?</h3>
              <p className="text-gray-600 mt-1 text-sm">
                Browse the provider list above, check ratings and reviews, and book directly through Nimart.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Are the {categoryName.toLowerCase()} providers verified?</h3>
              <p className="text-gray-600 mt-1 text-sm">
                Yes, providers on Nimart go through a verification process. Look for the verified badge on their profile.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
