// src/app/page.tsx
import Link from 'next/link';
import { SEO } from '@/components/common/SEO';
import { Info, CheckCircle } from 'lucide-react';

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "About Nimart – Nigeria's Service Marketplace",
  "description": "Nimart connects skilled Nigerian professionals with customers who need their services. Founded by Edidiong Edem, Nimart is free, local, and built for real Nigerian challenges.",
  "url": "https://nimart.ng/about",
  "isPartOf": {
    "@type": "WebSite",
    "name": "Nimart",
    "url": "https://nimart.ng"
  }
};

export default function AboutPage() {
  return (
    <>
      <SEO
        title="About Nimart | Nigeria's Local Service Marketplace"
        description="Nimart connects skilled Nigerians with customers near them. Free to use, built for local services. Founded by Edidiong Edem from Akwa Ibom."
        keywords="about Nimart, Nigerian service marketplace, local services Nigeria, Nimart founder, Edidiong Edem, connect with professionals Nigeria"
        url="https://nimart.ng/about"
        schema={pageSchema}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'About' }
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary-100 p-3 rounded-full">
              <Info className="h-6 w-6 text-primary-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">About Nimart</h1>
          </div>

          <p className="text-lg text-gray-600 mb-6">
            <strong className="text-primary-700">Nimart</strong> is Nigeria's trusted service marketplace. We connect you with verified local professionals – from plumbers and electricians to barbers, makeup artists, caterers, and more. Whether you need a quick repair or a full‑scale project, Nimart helps you find, book, and pay skilled workers near you, safely and easily.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
            <p className="text-amber-800 text-sm">
              <strong>Important:</strong> Nimart is <strong>not</strong> the NIMART healthcare programme (Nurse Initiated Management of Antiretroviral Therapy). If you were looking for medical information, please visit the{' '}
              <a href="https://academy.emguidance.com/course/nimart" target="_blank" rel="noopener noreferrer" className="text-amber-600 underline hover:text-amber-700">
                NIMART course page
              </a>{' '}
              instead.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <p className="text-sm text-gray-700"><strong>Find professionals</strong> – search by service and location.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <p className="text-sm text-gray-700"><strong>Book & pay</strong> securely through the platform.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <p className="text-sm text-gray-700"><strong>Verified providers</strong> – read reviews and see ratings.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <p className="text-sm text-gray-700"><strong>All across Nigeria</strong> – available in every state.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link href="/" className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition">
              Go to Nimart Homepage →
            </Link>
            <Link href="/search" className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition">
              Find Services
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}