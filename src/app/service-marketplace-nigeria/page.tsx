// src/app/service-marketplace-nigeria/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/supabase-any';
import {
  ShieldCheck,
  Star,
  Users,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Search,
  MessageSquare,
  MapPin,
  CreditCard,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Service Marketplace Platform in Nigeria | Nimart',
  description:
    'Nimart is Nigeria’s trusted service marketplace platform connecting customers with verified professionals. Book plumbers, electricians, beauty experts, and more.',
  openGraph: {
    title: 'Service Marketplace Platform in Nigeria | Nimart',
    description:
      'Nimart is Nigeria’s trusted service marketplace platform connecting customers with verified professionals. Book plumbers, electricians, beauty experts, and more.',
    url: 'https://www.nimart.ng/service-marketplace-nigeria',
    siteName: 'Nimart',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Service Marketplace Platform in Nigeria | Nimart',
    description:
      'Nimart is Nigeria’s trusted service marketplace platform connecting customers with verified professionals.',
    images: ['/og-image.png'],
  },
};

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-');
}

export default async function ServiceMarketplacePage() {
  // Fetch real data for dynamic content
  const { data: providersData } = await db.rpc('get_search_providers');
  const allProviders = Array.isArray(providersData) ? (providersData as any[]) : [];

  const totalProviders = allProviders.length;

  // Count categories
  const categories = new Set(allProviders.map((p) => p.selected_category_slug).filter(Boolean));

  // Count states
  const states = new Set(allProviders.map((p) => p.profile?.state_name).filter(Boolean));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: 'Nimart',
        description:
          'Nimart is a service marketplace platform in Nigeria connecting customers with verified professionals across categories like plumbing, electrical, beauty, technology, and more.',
        url: 'https://www.nimart.ng/service-marketplace-nigeria',
        image: 'https://www.nimart.ng/og-image.png',
        brand: {
          '@type': 'Brand',
          name: 'Nimart',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          reviewCount: '500',
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'NGN',
          availability: 'https://schema.org/InStock',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.nimart.ng' },
          { '@type': 'ListItem', position: 2, name: 'Service Marketplace Nigeria', item: 'https://www.nimart.ng/service-marketplace-nigeria' },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6">
              <Sparkles className="h-4 w-4" />
              Nigeria's Fastest Growing Service Marketplace
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Service Marketplace Platform in Nigeria
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8 max-w-2xl">
              Nimart connects you with {totalProviders}+ verified professionals across Nigeria.
              Find, compare, and book trusted services for your home, business, and lifestyle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
              >
                <Search className="h-5 w-5" />
                Find a Service
              </Link>
              <Link
                href="/auth/signup?role=provider"
                className="inline-flex items-center justify-center gap-2 bg-primary-900/20 border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-900/40 transition"
              >
                <Briefcase className="h-5 w-5" />
                Become a Provider
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <Users className="h-8 w-8 mx-auto text-primary-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">{totalProviders}</p>
              <p className="text-sm text-gray-500">Verified Providers</p>
            </div>
            <div>
              <Briefcase className="h-8 w-8 mx-auto text-primary-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">{categories.size}</p>
              <p className="text-sm text-gray-500">Service Categories</p>
            </div>
            <div>
              <MapPin className="h-8 w-8 mx-auto text-primary-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">{states.size}</p>
              <p className="text-sm text-gray-500">States Covered</p>
            </div>
            <div>
              <Star className="h-8 w-8 mx-auto text-yellow-400 fill-yellow-400 mb-2" />
              <p className="text-3xl font-bold text-gray-900">4.8</p>
              <p className="text-sm text-gray-500">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How Nimart Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Search & Compare</h3>
              <p className="text-gray-600 text-sm">
                Browse verified providers, compare ratings and reviews, and find the perfect match
                for your needs.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Communicate Directly</h3>
              <p className="text-gray-600 text-sm">
                Chat with providers, discuss details, and agree on pricing before you book.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Book Securely</h3>
              <p className="text-gray-600 text-sm">
                Book through Nimart's secure platform and pay when the job is done.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Nimart */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Choose Nimart?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, text: 'Every provider is verified with valid identification' },
              { icon: Star, text: 'Real reviews from real customers you can trust' },
              { icon: CheckCircle2, text: 'Only verified, quality professionals join' },
              { icon: MapPin, text: 'Find providers near you across Nigeria' },
              { icon: CreditCard, text: 'Secure and transparent payment process' },
              { icon: MessageSquare, text: 'Direct communication with your provider' },
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <feature.icon className="h-6 w-6 text-primary-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular States */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Browse Services by State
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[...states].sort().slice(0, 12).map((stateName) => (
              <Link
                key={stateName}
                href={`/providers/${slugify(stateName)}`}
                className="px-5 py-2.5 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-200 hover:border-primary-300 hover:text-primary-600 transition"
              >
                {stateName}
              </Link>
            ))}
          </div>
          <p className="text-center mt-8">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700"
            >
              Browse all providers <ArrowRight className="h-4 w-4" />
            </Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-primary-700 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Find Your Perfect Provider?
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Join thousands of Nigerians who trust Nimart for their service needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
            >
              Find a Provider
            </Link>
            <Link
              href="/auth/signup?role=provider"
              className="inline-flex items-center justify-center gap-2 bg-primary-900/20 border border-white/30 text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-900/40 transition"
            >
              Join as a Provider
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}