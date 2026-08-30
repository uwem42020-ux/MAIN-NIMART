import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/supabase-any';
import {
  MapPin,
  Star,
  Users,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Search,
  Sparkles,
  Calendar,
  Building2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Event Space in Akwa Ibom | Book Venues & Halls | Nimart',
  description:
    'Looking for event space in Akwa Ibom? Discover and book trusted event centers, halls, and outdoor venues. Compare prices, read reviews, and reserve your perfect space on Nimart.',
  openGraph: {
    title: 'Event Space in Akwa Ibom | Book Venues & Halls | Nimart',
    description:
      'Looking for event space in Akwa Ibom? Discover and book trusted event centers, halls, and outdoor venues on Nimart.',
    url: 'https://www.nimart.ng/event-space-akwa-ibom',
    siteName: 'Nimart',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Event Space in Akwa Ibom | Book Venues & Halls | Nimart',
    description:
      'Looking for event space in Akwa Ibom? Discover and book trusted event centers, halls, and outdoor venues on Nimart.',
    images: ['/og-image.png'],
  },
};

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-');
}

export default async function EventSpaceAkwaIbomPage() {
  // Fetch providers with venue category
  const { data: providersData } = await db.rpc('get_search_providers');
  const allProviders = Array.isArray(providersData) ? (providersData as any[]) : [];

  // Filter providers in "venues" category and Akwa Ibom state
  const akwaIbomVenues = allProviders.filter(
    (p) =>
      p.selected_category_slug === 'venues' &&
      p.profile?.state_name?.toLowerCase() === 'akwa ibom'
  );

  const totalVenues = akwaIbomVenues.length;

  // For internal links, show other states with venues
  const venueStates = new Map<string, number>();
  allProviders.forEach((p) => {
    if (p.selected_category_slug === 'venues' && p.profile?.state_name) {
      venueStates.set(p.profile.state_name, (venueStates.get(p.profile.state_name) || 0) + 1);
    }
  });
  const stateLinks = [...venueStates.entries()]
    .map(([name, count]) => ({ name, slug: slugify(name), count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: 'Event Space in Akwa Ibom - Nimart',
        description:
          'Find and book the best event spaces, halls, and venues in Akwa Ibom on Nimart.',
        url: 'https://www.nimart.ng/event-space-akwa-ibom',
        image: 'https://www.nimart.ng/og-image.png',
        brand: {
          '@type': 'Brand',
          name: 'Nimart',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.nimart.ng' },
          { '@type': 'ListItem', position: 2, name: 'Event Spaces', item: 'https://www.nimart.ng/categories/venues' },
          { '@type': 'ListItem', position: 3, name: 'Akwa Ibom', item: 'https://www.nimart.ng/event-space-akwa-ibom' },
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
              Find Your Perfect Event Venue
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Event Space in Akwa Ibom
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8 max-w-2xl">
              Discover and book trusted event centers, halls, and outdoor spaces in Akwa Ibom.
              Compare prices, read reviews, and reserve the perfect venue for weddings, parties,
              corporate events, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/search?category=venues&state=Akwa%20Ibom"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
              >
                <Search className="h-5 w-5" />
                Browse Event Spaces
              </Link>
              <Link
                href="/auth/signup?role=provider"
                className="inline-flex items-center justify-center gap-2 bg-primary-900/20 border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-900/40 transition"
              >
                <Building2 className="h-5 w-5" />
                List Your Venue
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
              <Building2 className="h-8 w-8 mx-auto text-primary-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">{totalVenues}</p>
              <p className="text-sm text-gray-500">Venues in Akwa Ibom</p>
            </div>
            <div>
              <Users className="h-8 w-8 mx-auto text-primary-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">500+</p>
              <p className="text-sm text-gray-500">Events Hosted</p>
            </div>
            <div>
              <Star className="h-8 w-8 mx-auto text-yellow-400 fill-yellow-400 mb-2" />
              <p className="text-3xl font-bold text-gray-900">4.7</p>
              <p className="text-sm text-gray-500">Average Rating</p>
            </div>
            <div>
              <Calendar className="h-8 w-8 mx-auto text-primary-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">24/7</p>
              <p className="text-sm text-gray-500">Booking Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Book Event Space on Nimart?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verified Venues</h3>
              <p className="text-gray-600 text-sm">
                All event spaces are verified to ensure quality and reliability.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Local Options</h3>
              <p className="text-gray-600 text-sm">
                Find event spaces in Uyo, Eket, Ikot Ekpene, and across Akwa Ibom.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real Reviews</h3>
              <p className="text-gray-600 text-sm">
                Read reviews from people who have hosted events at each venue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Other States with Venues */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Event Spaces in Other States
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {stateLinks.map((state) => (
              <Link
                key={state.slug}
                href={`/categories/venues/${state.slug}`}
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
              <h3 className="font-semibold text-gray-900">How do I find an event space in Akwa Ibom?</h3>
              <p className="text-gray-600 mt-2 text-sm">
                Use Nimart's search to filter by location, capacity, and price. Read reviews and
                compare venues to find the perfect space for your event.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">What types of event spaces are available?</h3>
              <p className="text-gray-600 mt-2 text-sm">
                From wedding halls to corporate meeting rooms and outdoor gardens, Nimart has
                venues for all types of events.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">Can I book an event space directly?</h3>
              <p className="text-gray-600 mt-2 text-sm">
                Yes, contact the venue provider through Nimart and confirm your booking directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-primary-700 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Find Your Event Space?
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Join thousands of Nigerians who trust Nimart for their event needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search?category=venues&state=Akwa%20Ibom"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
            >
              Browse Venues
            </Link>
            <Link
              href="/auth/signup?role=provider"
              className="inline-flex items-center justify-center gap-2 bg-primary-900/20 border border-white/30 text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-900/40 transition"
            >
              List Your Venue
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}