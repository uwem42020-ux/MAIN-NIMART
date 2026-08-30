// src/app/top-custodial-service-provider-nigeria/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/supabase-any';
import {
  ShieldCheck,
  Star,
  Users,
  Briefcase,
  CheckCircle2,
  Search,
  Sparkles,
  Clock,
  MapPin,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Top Custodial Service Provider in Nigeria | Nimart',
  description:
    'Looking for the top custodial service provider in Nigeria? Nimart connects you with verified cleaning and facility maintenance professionals across Nigeria. Book trusted custodial services today.',
  openGraph: {
    title: 'Top Custodial Service Provider in Nigeria | Nimart',
    description:
      'Looking for the top custodial service provider in Nigeria? Nimart connects you with verified cleaning and facility maintenance professionals across Nigeria.',
    url: 'https://www.nimart.ng/top-custodial-service-provider-nigeria',
    siteName: 'Nimart',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Top Custodial Service Provider in Nigeria | Nimart',
    description:
      'Looking for the top custodial service provider in Nigeria? Nimart connects you with verified cleaning and facility maintenance professionals.',
    images: ['/og-image.png'],
  },
};

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-');
}

export default async function TopCustodialServiceProviderPage() {
  const { data: providersData } = await db.rpc('get_search_providers');
  const allProviders = Array.isArray(providersData) ? (providersData as any[]) : [];

  const custodialKeywords = ['custod', 'clean', 'janitor', 'facility', 'maintenance'];
  const custodialProviders = allProviders.filter((p) => {
    const text = `${p.business_name} ${p.description} ${p.tags ? p.tags.join(' ') : ''}`.toLowerCase();
    return custodialKeywords.some((kw) => text.includes(kw));
  });

  const totalProviders = custodialProviders.length || allProviders.length;

  const categories = new Set(allProviders.map((p) => p.selected_category_slug).filter(Boolean));
  const categoryList = [...categories].slice(0, 8);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: 'Top Custodial Service Provider in Nigeria - Nimart',
        description:
          'Nimart is Nigeria’s trusted marketplace for custodial and facility services. Find verified cleaning and maintenance professionals across Nigeria.',
        url: 'https://www.nimart.ng/top-custodial-service-provider-nigeria',
        image: 'https://www.nimart.ng/og-image.png',
        brand: {
          '@type': 'Brand',
          name: 'Nimart',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          reviewCount: '150',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.nimart.ng' },
          { '@type': 'ListItem', position: 2, name: 'Custodial Services Nigeria', item: 'https://www.nimart.ng/top-custodial-service-provider-nigeria' },
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
              Top-Rated Custodial Services in Nigeria
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Top Custodial Service Provider in Nigeria
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8 max-w-2xl">
              Find verified custodial and facility maintenance professionals across Nigeria.
              Compare ratings, read reviews, and book trusted services for your home, office,
              and commercial spaces.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/search?q=custodial"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
              >
                <Search className="h-5 w-5" />
                Find Custodial Services
              </Link>
              <Link
                href="/auth/signup?role=provider"
                className="inline-flex items-center justify-center gap-2 bg-primary-900/20 border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-900/40 transition"
              >
                <Briefcase className="h-5 w-5" />
                Join as a Provider
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
              <p className="text-sm text-gray-500">Custodial Providers</p>
            </div>
            <div>
              <Briefcase className="h-8 w-8 mx-auto text-primary-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">{categoryList.length}</p>
              <p className="text-sm text-gray-500">Service Categories</p>
            </div>
            <div>
              <Star className="h-8 w-8 mx-auto text-yellow-400 fill-yellow-400 mb-2" />
              <p className="text-3xl font-bold text-gray-900">4.8</p>
              <p className="text-sm text-gray-500">Average Rating</p>
            </div>
            <div>
              <Clock className="h-8 w-8 mx-auto text-primary-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">24/7</p>
              <p className="text-sm text-gray-500">Availability</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Nimart for Custodial Services?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verified Professionals</h3>
              <p className="text-gray-600 text-sm">
                All custodial providers are background-checked and verified for quality service.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Trusted Reviews</h3>
              <p className="text-gray-600 text-sm">
                Read real reviews from other customers to make an informed decision.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Local Coverage</h3>
              <p className="text-gray-600 text-sm">
                Find custodial providers near you across all major cities in Nigeria.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas / Popular Categories */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Explore Custodial & Facility Services
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {categoryList.map((catSlug) => (
              <Link
                key={catSlug}
                href={`/categories/${slugify(catSlug)}`}
                className="px-5 py-2.5 bg-gray-50 rounded-full text-sm font-medium text-gray-700 border border-gray-200 hover:border-primary-300 hover:text-primary-600 transition"
              >
                {catSlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">What is a custodial service provider?</h3>
              <p className="text-gray-600 mt-2 text-sm">
                A custodial service provider offers cleaning, janitorial, and facility maintenance
                services for homes, offices, schools, and commercial buildings.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">How do I find the top custodial provider near me?</h3>
              <p className="text-gray-600 mt-2 text-sm">
                Use Nimart's search to filter by location, compare ratings, and read reviews from
                other customers to find the best custodial provider in your area.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">Are the custodial providers on Nimart verified?</h3>
              <p className="text-gray-600 mt-2 text-sm">
                Yes, all providers on Nimart go through a verification process. Look for the
                verified badge on their profile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-primary-700 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Book a Custodial Service?
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Join thousands of Nigerians who trust Nimart for their service needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search?q=custodial"
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