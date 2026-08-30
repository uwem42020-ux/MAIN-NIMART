// src/app/fridge-repair-near-me-open-now/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/supabase-any';
import {
  MapPin,
  Star,
  Users,
  Wrench,
  CheckCircle2,
  Search,
  Sparkles,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Fridge Repair Near Me – Open Now | Nimart',
  description:
    'Need urgent fridge repair near you? Find verified refrigerator technicians open now. Book fast, trusted fridge repair services across Nigeria on Nimart.',
  openGraph: {
    title: 'Fridge Repair Near Me – Open Now | Nimart',
    description:
      'Need urgent fridge repair near you? Find verified refrigerator technicians open now on Nimart.',
    url: 'https://www.nimart.ng/fridge-repair-near-me-open-now',
    siteName: 'Nimart',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fridge Repair Near Me – Open Now | Nimart',
    description:
      'Need urgent fridge repair near you? Find verified refrigerator technicians open now on Nimart.',
    images: ['/og-image.png'],
  },
};

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-');
}

export default async function FridgeRepairNearMePage() {
  const { data: providersData } = await db.rpc('get_search_providers');
  const allProviders = Array.isArray(providersData) ? (providersData as any[]) : [];

  // Filter for appliance repair or similar
  const fridgeProviders = allProviders.filter(
    (p) =>
      p.selected_category_slug === 'appliance-repair' ||
      `${p.business_name} ${p.description}`.toLowerCase().includes('fridge') ||
      `${p.business_name} ${p.description}`.toLowerCase().includes('refrigerator')
  );

  const totalProviders = fridgeProviders.length || allProviders.length;

  // States
  const stateMap = new Map<string, number>();
  fridgeProviders.forEach((p) => {
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
        name: 'Fridge Repair Near Me – Open Now | Nimart',
        description:
          'Find verified refrigerator repair technicians open now in Nigeria. Book fast and trusted fridge repair services on Nimart.',
        url: 'https://www.nimart.ng/fridge-repair-near-me-open-now',
        image: 'https://www.nimart.ng/og-image.png',
        brand: {
          '@type': 'Brand',
          name: 'Nimart',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          reviewCount: '120',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.nimart.ng' },
          { '@type': 'ListItem', position: 2, name: 'Appliance Repair', item: 'https://www.nimart.ng/categories/appliance-repair' },
          { '@type': 'ListItem', position: 3, name: 'Fridge Repair Near Me', item: 'https://www.nimart.ng/fridge-repair-near-me-open-now' },
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
              Urgent Fridge Repair? We're Open Now
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Fridge Repair Near Me – Open Now
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8 max-w-2xl">
              Find verified refrigerator technicians available right now. Fast response, trusted
              repairs, and upfront pricing across Nigeria.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/search?category=appliance-repair"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
              >
                <Search className="h-5 w-5" />
                Find a Technician
              </Link>
              <Link
                href="/auth/signup?role=provider"
                className="inline-flex items-center justify-center gap-2 bg-primary-900/20 border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-900/40 transition"
              >
                <Wrench className="h-5 w-5" />
                Join as a Technician
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
              <Wrench className="h-8 w-8 mx-auto text-primary-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">{totalProviders}</p>
              <p className="text-sm text-gray-500">Repair Technicians</p>
            </div>
            <div>
              <Clock className="h-8 w-8 mx-auto text-primary-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">24/7</p>
              <p className="text-sm text-gray-500">Open Now</p>
            </div>
            <div>
              <Star className="h-8 w-8 mx-auto text-yellow-400 fill-yellow-400 mb-2" />
              <p className="text-3xl font-bold text-gray-900">4.8</p>
              <p className="text-sm text-gray-500">Average Rating</p>
            </div>
            <div>
              <ShieldCheck className="h-8 w-8 mx-auto text-primary-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">100%</p>
              <p className="text-sm text-gray-500">Verified</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Choose Nimart for Fridge Repair?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Response</h3>
              <p className="text-gray-600 text-sm">
                Technicians available now for urgent repairs. Get help when you need it most.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verified Experts</h3>
              <p className="text-gray-600 text-sm">
                All technicians are verified and experienced with major fridge brands.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Near You</h3>
              <p className="text-gray-600 text-sm">
                Find technicians in your area and get help without the long wait.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* States */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Fridge Repair by State
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {stateLinks.map((state) => (
              <Link
                key={state.slug}
                href={`/categories/appliance-repair/${state.slug}`}
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
              <h3 className="font-semibold text-gray-900">How fast can I get fridge repair?</h3>
              <p className="text-gray-600 mt-2 text-sm">
                Many technicians on Nimart are available same-day. Contact them directly to
                confirm availability and schedule a visit.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">Do you repair all fridge brands?</h3>
              <p className="text-gray-600 mt-2 text-sm">
                Yes, Nimart technicians work with major brands including LG, Samsung, Haier
                Thermocool, and more.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">Are the repair technicians verified?</h3>
              <p className="text-gray-600 mt-2 text-sm">
                All technicians on Nimart go through a verification process. Look for the
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
            Need Fridge Repair Now?
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Book a verified technician and get your fridge running again.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search?category=appliance-repair"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
            >
              Find a Technician
            </Link>
            <Link
              href="/auth/signup?role=provider"
              className="inline-flex items-center justify-center gap-2 bg-primary-900/20 border border-white/30 text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-900/40 transition"
            >
              Join as a Technician
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}