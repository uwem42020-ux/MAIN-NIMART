// src/app/top-custodial-service-provider-nigeria/page.tsx
import Link from 'next/link';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import {
  ShieldCheck,
  Star,
  Users,
  Briefcase,
  Search,
  Sparkles,
  Clock,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

export const metadata: Metadata = buildMetadata({
  title: 'Custodial Services in Nigeria - Join Nimart as a Custodial Provider',
  description:
    "Nimart is expanding into custodial and facility services across Nigeria. If you're a cleaning or facility maintenance professional, join Nimart for free and get discovered by customers.",
  path: '/top-custodial-service-provider-nigeria',
});

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: 'Custodial Services in Nigeria - Nimart',
      description:
        'Nimart is expanding into custodial and facility services across Nigeria. Join as a custodial provider today.',
      url: 'https://www.nimart.ng/top-custodial-service-provider-nigeria',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Nimart',
        url: 'https://www.nimart.ng',
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.nimart.ng' },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Custodial Services',
            item: 'https://www.nimart.ng/top-custodial-service-provider-nigeria',
          },
        ],
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is a custodial service provider?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A custodial service provider offers cleaning, janitorial, and facility maintenance services for homes, offices, schools, and commercial buildings.',
          },
        },
        {
          '@type': 'Question',
          name: 'Are custodial providers available on Nimart right now?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Nimart is currently onboarding custodial providers. As cleaning and facility maintenance professionals join, they will appear in search results. In the meantime, browse other verified services across Nigeria.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I join Nimart as a custodial provider?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Create a free account at nimart.ng/auth/signup, complete your provider profile, and customers will be able to find and book you. Joining is 100% free.',
          },
        },
      ],
    },
  ],
};

export default function TopCustodialServiceProviderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero - Honest messaging */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6">
              <Sparkles className="h-4 w-4" />
              Now expanding into custodial services
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Custodial Services in Nigeria
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8 max-w-2xl">
              Nimart is building Nigeria's most trusted marketplace for cleaning, janitorial, and
              facility maintenance services. We're currently onboarding custodial professionals across the country.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/signup?role=provider"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
              >
                <Briefcase className="h-5 w-5" />
                Join as a Custodial Provider
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 bg-primary-900/20 border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-900/40 transition"
              >
                <Search className="h-5 w-5" />
                Browse Other Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Honest "coming soon" message */}
      <section className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 mb-6">
            <Users className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            We're onboarding custodial providers
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Nimart is actively recruiting cleaning, janitorial, and facility maintenance professionals
            across Nigeria. If you're a custodial service provider, this is the perfect time to join
            for free and be among the first listed.
          </p>
          <Link
            href="/auth/signup?role=provider"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-700 transition"
          >
            <Briefcase className="h-5 w-5" />
            Join Nimart for Free
          </Link>
        </div>
      </section>

      {/* Why Join - focused on providers */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Join Nimart as a Custodial Provider?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">100% Free to Join</h3>
              <p className="text-gray-600 text-sm">
                No registration fee. No commission on your first bookings. Create your profile
                and start getting discovered by customers across Nigeria.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reach Customers Locally</h3>
              <p className="text-gray-600 text-sm">
                Set your service area and get matched with customers in your city or LGA
                who are actively searching for cleaning and facility services.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Build Your Reputation</h3>
              <p className="text-gray-600 text-sm">
                Get reviews from real customers. Build a verified profile. Grow your
                cleaning business through word-of-mouth on Nimart.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What counts as custodial */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            What We Mean by "Custodial Services"
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary-600" />
                Cleaning & Janitorial
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Residential cleaning</li>
                <li>• Commercial office cleaning</li>
                <li>• Post-construction cleanup</li>
                <li>• Deep cleaning services</li>
                <li>• Pest control & fumigation</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-600" />
                Facility Maintenance
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Building maintenance</li>
                <li>• Groundskeeping</li>
                <li>• Equipment servicing</li>
                <li>• Waste management</li>
                <li>• Security & access control</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ - honest */}
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
              <h3 className="font-semibold text-gray-900">Are custodial providers available on Nimart right now?</h3>
              <p className="text-gray-600 mt-2 text-sm">
                Nimart is currently onboarding custodial providers. As cleaning and facility
                maintenance professionals join, they will appear in search results. In the
                meantime, browse other verified services across Nigeria.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">How do I join Nimart as a custodial provider?</h3>
              <p className="text-gray-600 mt-2 text-sm">
                Create a free account at{' '}
                <Link href="/auth/signup?role=provider" className="text-primary-600 hover:underline">
                  nimart.ng/auth/signup
                </Link>
                , complete your provider profile, and customers will be able to find and book you.
                Joining is 100% free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-primary-700 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Grow Your Cleaning Business?
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Join Nimart for free and be among the first custodial providers on Nigeria's fastest-growing service marketplace.
          </p>
          <Link
            href="/auth/signup?role=provider"
            className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
          >
            <Briefcase className="h-5 w-5" />
            Join as a Provider
          </Link>
        </div>
      </section>
    </>
  );
}