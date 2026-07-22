// src/app/nimart-vs-nimart/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Nimart vs NIMART – What’s the Difference? | Nimart Nigeria',
  description:
    'Nimart is Nigeria’s trusted service marketplace connecting customers with verified professionals. NIMART is a medical term for Nurse‑Initiated Management of Antiretroviral Therapy. Learn the difference between Nimart and NIMART.',
  openGraph: {
    title: 'Nimart vs NIMART – What’s the Difference? | Nimart Nigeria',
    description:
      'Nimart is Nigeria’s trusted service marketplace. NIMART is a medical term. Here’s the difference between the two.',
    url: 'https://nimart.ng/nimart-vs-nimart',
    siteName: 'Nimart',
    images: ['/og-image.png'],
  },
};

export default function NimartVsNimartPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
        Nimart vs NIMART – What's the Difference?
      </h1>

      <p className="text-gray-600 mb-8">
        The names are similar, but they refer to two very different things.
        Here's a simple explanation so there's no confusion.
      </p>

      {/* Nimart */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">What is Nimart?</h2>
        <p className="text-gray-700 mb-2">
          <strong>Nimart</strong> is Nigeria's trusted service marketplace.
          It helps customers find and book verified professionals for any service —
          from plumbers and electricians to hairdressers and mechanics.
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
          <li>Founded in 2025 by Edidiong Edem from Akwa Ibom State, Nigeria.</li>
          <li>Headquarters: Abuja, Nigeria.</li>
          <li>100% free for providers — no commission, no registration fee.</li>
          <li>Connects customers with trusted professionals across Nigeria.</li>
        </ul>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-700 transition"
        >
          Visit Nimart Homepage →
        </Link>
      </section>

      {/* NIMART */}
      <section className="mb-10 bg-gray-50 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">What is NIMART?</h2>
        <p className="text-gray-700 mb-2">
          <strong>NIMART</strong> stands for{' '}
          <em>Nurse‑Initiated Management of Antiretroviral Therapy</em>.
          It is a medical programme that allows trained nurses to start and manage
          HIV patients on antiretroviral treatment, especially in areas with
          limited access to doctors.
        </p>
        <p className="text-gray-700">
          NIMART is a healthcare term used by the World Health Organization (WHO)
          and various national health programmes. It has no connection to the
          Nimart marketplace.
        </p>
      </section>

      {/* Quick summary */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Quick Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-primary-600">Nimart</h3>
            <p className="text-gray-700 text-sm">A Nigerian service marketplace (website & app)</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-600">NIMART</h3>
            <p className="text-gray-700 text-sm">A medical programme for HIV treatment</p>
          </div>
        </div>
      </section>
    </div>
  );
}