// src/app/become-a-provider/page.tsx
'use client';

import Link from 'next/link';
import {
  Briefcase, Users, Wallet, Shield, Zap, Check, ArrowRight,
  Camera, MapPin, Star, TrendingUp, Clock, Crown,
} from 'lucide-react';

const BENEFITS = [
  {
    icon: Users,
    title: 'Real Customers',
    body: 'Customers near you search Nimart every day for your exact service. No cold calls.',
  },
  {
    icon: Wallet,
    title: 'No Commission',
    body: 'You keep 100%. Negotiate and get paid directly by the customer.',
  },
  {
    icon: Zap,
    title: 'Free Forever',
    body: 'No monthly fees. Optional Nicoin boosts if you want extra visibility.',
  },
  {
    icon: Shield,
    title: 'Verified Badge',
    body: 'Verified providers get more bookings. Upload your documents, get the badge.',
  },
  {
    icon: Crown,
    title: 'Get Featured',
    body: 'Top-rated providers appear on the home screen and in search results.',
  },
  {
    icon: TrendingUp,
    title: 'Build a Reputation',
    body: 'Collect reviews, grow your rating, and become the go-to pro in your area.',
  },
];

const STEPS = [
  {
    icon: Camera,
    step: '1',
    title: 'Add a photo',
    body: 'Upload a clear photo. Customers trust faces, not logos.',
  },
  {
    icon: Briefcase,
    step: '2',
    title: 'Add your business',
    body: 'Business name, location, and the services you offer.',
  },
  {
    icon: MapPin,
    step: '3',
    title: 'Go live',
    body: 'You appear in search. Customers message and book you.',
  },
];

const FAQS = [
  {
    q: 'How much does it cost?',
    a: 'Nothing. Nimart is completely free to join. Optional boosts are the only paid feature.',
  },
  {
    q: 'When do I start getting customers?',
    a: 'As soon as your profile is complete and approved — usually within a few hours.',
  },
  {
    q: 'Do I need to be in Lagos or Abuja?',
    a: 'No. We list providers across all 36 states and the FCT.',
  },
  {
    q: 'How do I get paid?',
    a: 'You agree on a price with the customer and get paid directly. Nimart never touches service payments.',
  },
  {
    q: 'What if I don\'t get bookings?',
    a: 'Zero risk — no fee, no obligation. Complete your profile and you\'re discoverable forever.',
  },
];

const CATEGORIES = [
  'Plumbers', 'Electricians', 'Mechanics', 'Hair Stylists',
  'Makeup Artists', 'Photographers', 'Cleaners', 'Carpenters',
  'Caterers', 'Web Designers', 'Tailors', 'AC Repair',
  'Painters', 'Tutors', 'DJs', 'Barbers',
];

export default function BecomeAProviderPage() {
  return (
    <div className="bg-white">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-emerald-50" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold mb-5">
            <Briefcase className="h-3.5 w-3.5" />
            FOR NIGERIAN SERVICE PROVIDERS
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
            Get more customers.
            <br />
            <span className="text-primary-600">Join Nimart free.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            Nigeria's fastest-growing service marketplace. Reach customers in
            your area. No commission. No monthly fees. No risk.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/auth/signup?role=provider"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-primary-600/30 hover:bg-primary-700 transition-all hover:scale-[1.02] w-full sm:w-auto justify-center"
            >
              Start provider signup
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-8 py-4 text-gray-700 rounded-xl font-semibold text-lg hover:bg-white transition w-full sm:w-auto justify-center"
            >
              How it works
            </Link>
          </div>

          <p className="mt-5 text-sm text-gray-500">
            Takes 2 minutes · Free forever · No credit card
          </p>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="border-y border-gray-100 py-6 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary-600" />
              <span>Free forever</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary-600" />
              <span>0% commission</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary-600" />
              <span>Direct payment</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary-600" />
              <span>All 36 states</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES SCROLL ── */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            60+ service categories
          </h2>
          <p className="text-center text-gray-600 mb-10 max-w-xl mx-auto">
            Whatever you do, there's a spot for you on Nimart.
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {CATEGORIES.map((cat) => (
              <span
                key={cat}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700"
              >
                {cat}
              </span>
            ))}
            <span className="px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-bold">
              + 44 more
            </span>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Live in 3 steps
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              No approval delays. No paperwork. Just complete your profile and
              start receiving customer requests.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="relative">
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 h-full hover:shadow-lg transition-shadow">
                    <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mb-4">
                      <Icon className="h-7 w-7 text-primary-600" />
                    </div>
                    <div className="text-xs font-bold text-primary-600 mb-1">
                      STEP {s.step}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {s.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {s.body}
                    </p>
                  </div>
                  {i < 2 && (
                    <div className="hidden sm:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <ArrowRight className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Why providers choose Nimart
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Built for Nigerian tradespeople, not for corporate agencies.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-primary-200 hover:shadow-md transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {b.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          </div>
          <blockquote className="text-xl sm:text-2xl text-gray-800 font-medium leading-snug mb-4">
            "Nimart connects me with customers I never would have found on my
            own. Best of all — I keep every naira I earn."
          </blockquote>
          <div className="text-sm text-gray-500">
            Join providers across Lagos, Abuja, Port Harcourt, and beyond
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-10">
            Common questions
          </h2>

          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden group"
              >
                <summary className="px-6 py-5 cursor-pointer flex items-center justify-between font-semibold text-gray-900 hover:bg-gray-50 list-none">
                  <span className="pr-4">{faq.q}</span>
                  <span className="text-primary-600 text-2xl leading-none group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold mb-5">
            <Clock className="h-3.5 w-3.5" />
            2 MINUTES TO SIGN UP
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
            Start getting customers
            <br />
            this week.
          </h2>

          <p className="text-lg text-white/90 max-w-xl mx-auto mb-8">
            Join hundreds of Nigerian service providers already on Nimart.
            Free to join. Free forever.
          </p>

          <Link
            href="/auth/signup?role=provider"
            className="inline-flex items-center gap-2 px-10 py-4 bg-white text-primary-700 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
          >
            Become a Provider
            <ArrowRight className="h-5 w-5" />
          </Link>

          <p className="mt-5 text-white/80 text-sm">
            No card. No commitment. Cancel anytime.
          </p>
        </div>
      </section>
    </div>
  );
}