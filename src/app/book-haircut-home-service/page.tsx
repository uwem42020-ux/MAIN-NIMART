// src/app/book-haircut-home-service/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/supabase-any';
import {
  MapPin,
  Star,
  Users,
  Scissors,
  CheckCircle2,
  Search,
  Sparkles,
  Clock,
  Home,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Book Haircut Home Service in Nigeria | Nimart',
  description:
    'Book a professional haircut at home in Nigeria. Browse verified mobile barbers and hairstylists. Compare ratings, read reviews, and schedule home service on Nimart.',
  openGraph: {
    title: 'Book Haircut Home Service in Nigeria | Nimart',
    description:
      'Book a professional haircut at home in Nigeria. Browse verified mobile barbers and hairstylists on Nimart.',
    url: 'https://www.nimart.ng/book-haircut-home-service',
    siteName: 'Nimart',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book Haircut Home Service in Nigeria | Nimart',
    description:
      'Book a professional haircut at home in Nigeria. Browse verified mobile barbers and hairstylists on Nimart.',
    images: ['/og-image.png'],
  },
};

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-');
}

export default async function BookHaircutHomeServicePage() {
  const { data: providersData } = await db.rpc('get_search_providers');
  const allProviders = Array.isArray(providersData) ? (providersData as any[]) : [];

  // Filter providers in hair/beauty categories
  const hairProviders = allProviders.filter((p) =>
    ['hair', 'makeup', 'spa', 'nail'].includes(p.selected_category_slug)
  );

  const totalProviders = hairProviders.length;

  // States with hair providers
  const stateMap = new Map<string, number>();
  hairProviders.forEach((p) => {
    const state = p.profile?.state_name;
    if (state) stateMap.set(state, (stateMap.get(state) || 0) + 1);
  });
  const stateLinks = [...stateMap.entries()]
    .map(([name, count]) => ({ name, slug: slugify(name), count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: 'Book Haircut Home Service in Nigeria - Nimart',
        description:
          'Book professional haircut at home in Nigeria. Find verified mobile barbers and hairstylists on Nimart.',
        url: 'https://www.nimart.ng/book-haircut-home-service',
        image: 'https://www.nimart.ng/og-image.png',
        brand: {
          '@type': 'Brand',
          name: 'Nimart',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '200',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.nimart.ng' },
          { '@type': 'ListItem', position: 2, name: 'Hair Services', item: 'https://www.nimart.ng/categories/hair' },
          { '@type': 'ListItem', position: 3, name: 'Home Service', item: 'https://www.nimart.ng/book-haircut-home-service' },
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
              Professional Haircuts at Your Doorstep
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Book Haircut Home Service in Nigeria
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8 max-w-2xl">
              Get a professional haircut at home. Browse verified mobile barbers and hairstylists,
              compare ratings, read reviews, and schedule your appointment with ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/search?category=hair"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
              >
                <Search className="h-5 w-5" />
                Find a Stylist
              </Link>
              <Link
                href="/auth/signup?role=provider"
                className="inline-flex items-center justify-center gap-2 bg-primary-900/20 border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-900/40 transition"
              >
                <Scissors className="h-5 w-5" />
                Join as a Stylist
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
              <Scissors className="h-8 w-8 mx-auto text-primary-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">{totalProviders}</p>
              <p className="text-sm text-gray-500">Mobile Stylists</p>
            </div>
            <div>
              <Users className="h-8 w-8 mx-auto text-primary-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">1000+</p>
              <p className="text-sm text-gray-500">Happy Clients</p>
            </div>
            <div>
              <Star className="h-8 w-8 mx-auto text-yellow-400 fill-yellow-400 mb-2" />
              <p className="text-3xl font-bold text-gray-900">4.9</p>
              <p className="text-sm text-gray-500">Average Rating</p>
            </div>
            <div>
              <Clock className="h-8 w-8 mx-auto text-primary-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">On-Time</p>
              <p className="text-sm text-gray-500">Service Guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Book Haircut Home Service?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <Home className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Convenience</h3>
              <p className="text-gray-600 text-sm">
                Get a professional haircut without leaving your home. Perfect for busy schedules.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verified Stylists</h3>
              <p className="text-gray-600 text-sm">
                All stylists are verified and background-checked for your safety.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real Reviews</h3>
              <p className="text-gray-600 text-sm">
                Read reviews from customers to find the best stylist for your needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* States with Hair Providers */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Haircut Home Service by State
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {stateLinks.map((state) => (
              <Link
                key={state.slug}
                href={`/categories/hair/${state.slug}`}
                className="px-5 py-2.5 bg-gray-50 rounded-full text-sm font-medium text-gray-700 border border-gray-200 hover:border-primary-300 hover:text-primary-600 transition"
              >
                {state.name} ({state.count})
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
              <h3 className="font-semibold text-gray-900">How do I book a haircut at home?</h3>
              <p className="text-gray-600 mt-2 text-sm">
                Browse verified mobile barbers on Nimart, check their availability, and send a
                booking request. They'll confirm and come to your location.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">What areas do you cover?</h3>
              <p className="text-gray-600 mt-2 text-sm">
                We have mobile stylists across major Nigerian cities. Use the state links above
                to find one near you.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">Are the stylists verified?</h3>
              <p className="text-gray-600 mt-2 text-sm">
                Yes, all stylists on Nimart go through a verification process. Look for the
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
            Ready for a Fresh Haircut at Home?
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Book a verified stylist today and skip the salon queue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search?category=hair"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
            >
              Book Now
            </Link>
            <Link
              href="/auth/signup?role=provider"
              className="inline-flex items-center justify-center gap-2 bg-primary-900/20 border border-white/30 text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-900/40 transition"
            >
              Become a Stylist
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}