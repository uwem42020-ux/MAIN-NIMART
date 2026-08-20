// src/app/providers/[state]/StateLandingClient.tsx
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

interface StateLandingClientProps {
  stateName: string;
  providers: ProviderWithProfile[];
  allStates: { name: string; slug: string; count: number }[];
}

export default function StateLandingClient({
  stateName,
  providers,
  allStates,
}: StateLandingClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Compute stats
  const totalProviders = providers.length;
  const categories = new Set(providers.map((p) => p.selected_category_slug).filter(Boolean));
  const categoriesCount = categories.size;
  const avgRating = providers.length
    ? providers.reduce((sum, p) => sum + (p.average_rating || 0), 0) / providers.length
    : 0;

  // Category counts
  const categoryCounts = new Map<string, number>();
  providers.forEach((p) => {
    if (p.selected_category_slug) {
      categoryCounts.set(
        p.selected_category_slug,
        (categoryCounts.get(p.selected_category_slug) || 0) + 1
      );
    }
  });

  const displayCategories = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-700 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex items-center gap-2 text-sm text-primary-100 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/search" className="hover:text-white">Providers</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{stateName}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Trusted Service Providers in {stateName}
          </h1>
          <p className="text-primary-100 max-w-2xl text-base md:text-lg">
            Browse {totalProviders} verified professionals in {stateName}. Compare ratings, read
            reviews, and book services from trusted local providers on Nimart.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-md">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <p className="text-2xl font-bold">{totalProviders}</p>
              <p className="text-xs opacity-80">Providers</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <Briefcase className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <p className="text-2xl font-bold">{categoriesCount}</p>
              <p className="text-xs opacity-80">Categories</p>
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
        {/* Popular categories */}
        {displayCategories.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Popular Categories in {stateName}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {displayCategories.map(([slug, count]) => {
                const displayName = slug
                  .split('-')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ');
                return (
                  <Link
                    key={slug}
                    href={`/search?category=${slug}&state=${encodeURIComponent(stateName)}`}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-3 group-hover:bg-primary-100 transition">
                      <Briefcase className="h-5 w-5 text-primary-600" />
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900 truncate">{displayName}</h3>
                    <p className="text-xs text-primary-600 mt-1">{count} provider{count !== 1 ? 's' : ''}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Providers */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              All Providers in {stateName}
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
                href={`/search?state=${encodeURIComponent(stateName)}`}
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
              <h3 className="font-semibold text-gray-900">How do I find trusted providers in {stateName}?</h3>
              <p className="text-gray-600 mt-1 text-sm">
                Browse the provider list above, check ratings and reviews, and book directly through
                Nimart. All providers are verified and reviewed by real customers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">What services are available in {stateName}?</h3>
              <p className="text-gray-600 mt-1 text-sm">
                We have professionals across categories like plumbing, electrical, beauty, cleaning,
                technology, events, and more. Use the category chips or search to find exactly what
                you need.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">How does booking work?</h3>
              <p className="text-gray-600 mt-1 text-sm">
                Select a provider, choose a service, and send a booking request. The provider will
                confirm availability and you can communicate directly through Nimart.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Are the providers verified?</h3>
              <p className="text-gray-600 mt-1 text-sm">
                Providers on Nimart go through a verification process. Look for the verified badge
                on their profile. You can also read reviews from other customers before booking.
              </p>
            </div>
          </div>
        </section>

        {/* Other states */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Explore Other States</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {allStates.map((state) => (
              <Link
                key={state.slug}
                href={`/providers/${state.slug}`}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition',
                  state.name === stateName
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                )}
              >
                {state.name} ({state.count})
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
