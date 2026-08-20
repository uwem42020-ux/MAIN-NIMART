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

interface CategoryStateClientProps {
  categoryName: string;
  categorySlug: string;
  stateName: string;
  providers: ProviderWithProfile[];
  lgasWithCount: { name: string; count: number }[];
}

export default function CategoryStateClient({
  categoryName,
  categorySlug,
  stateName,
  providers,
  lgasWithCount,
}: CategoryStateClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const totalProviders = providers.length;
  const avgRating = providers.length
    ? providers.reduce((sum, p) => sum + (p.average_rating || 0), 0) / providers.length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-700 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex items-center gap-2 text-sm text-primary-100 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/categories/${categorySlug}`} className="hover:text-white">{categoryName}</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{stateName}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {categoryName} Services in {stateName}
          </h1>
          <p className="text-primary-100 max-w-2xl text-base md:text-lg">
            Browse {totalProviders} verified {categoryName.toLowerCase()} providers in {stateName}.
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
              <p className="text-2xl font-bold">{lgasWithCount.length}</p>
              <p className="text-xs opacity-80">LGAs</p>
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
        {/* LGAs */}
        {lgasWithCount.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {categoryName} by LGA in {stateName}
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {lgasWithCount.map((lga) => (
                <Link
                  key={lga.name}
                  href={`/search?category=${categorySlug}&lga=${encodeURIComponent(lga.name)}`}
                  className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-600 transition"
                >
                  {lga.name} ({lga.count})
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Providers */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              All {categoryName} Providers in {stateName}
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
                href={`/search?category=${categorySlug}&state=${encodeURIComponent(stateName)}`}
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
              <h3 className="font-semibold text-gray-900">How do I find {categoryName.toLowerCase()} services in {stateName}?</h3>
              <p className="text-gray-600 mt-1 text-sm">
                Browse the provider list above, check ratings and reviews, and book directly through Nimart.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Are the providers verified?</h3>
              <p className="text-gray-600 mt-1 text-sm">
                Yes, providers on Nimart go through a verification process. Look for the verified badge.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
