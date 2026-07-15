// src/app/terms/page.tsx
import Link from 'next/link';
import { ArrowRight, Scale } from 'lucide-react';
import { SEO } from '@/components/common/SEO';

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Terms of Service – Nimart",
  "description": "Read the terms and conditions for using Nimart, Nigeria's service marketplace.",
  "url": "https://nimart.ng/terms",
  "isPartOf": {
    "@type": "WebSite",
    "name": "Nimart",
    "url": "https://nimart.ng"
  }
};

export default function TermsPage() {
  return (
    <>
      <SEO
        title="Terms of Service | Nimart"
        description="Read the terms and conditions for using Nimart, Nigeria's service marketplace."
        keywords="terms of service, Nimart terms, marketplace terms, Nigeria"
        url="https://nimart.ng/terms"
        schema={pageSchema}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Terms' }
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary-100 p-3 rounded-full">
            <Scale className="h-6 w-6 text-primary-700" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Terms of Service</h1>
        </div>
        <p className="text-gray-500 mb-8">
          Last updated: {new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p>
              Welcome to Nimart ("Company", "we", "our", "us"). By accessing or using our website located at{' '}
              <Link href="/" className="text-primary-600 hover:underline">https://nimart.ng</Link>{' '}
              (the "Platform"), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the Platform.
            </p>
            <p className="mt-2">
              Nimart provides a marketplace that connects customers ("Customers") with independent service providers ("Providers"). Nimart itself does not provide any of the services listed on the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Eligibility</h2>
            <p>You must be at least 18 years old and capable of forming a binding contract to use the Platform. By creating an account, you represent and warrant that you meet these requirements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Account Registration</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and complete information during registration and to update it as necessary. Nimart reserves the right to suspend or terminate your account for any violation of these Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Provider Services and Bookings</h2>
            <p>Providers are independent contractors, not employees of Nimart. Nimart does not guarantee the quality, safety, or legality of the services offered. Customers are solely responsible for selecting a Provider and negotiating the terms of the service. Nimart is not a party to any agreement between Customers and Providers.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Payments and Fees</h2>
            <p>Nimart may charge service fees for certain features (e.g., boosted listings). All fees are non‑refundable unless otherwise stated. Payments between Customers and Providers are handled directly between the parties; Nimart is not responsible for payment disputes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Post false, misleading, or fraudulent content.</li>
              <li>Harass, threaten, or harm other users.</li>
              <li>Use the Platform for any illegal purpose.</li>
              <li>Attempt to gain unauthorized access to our systems.</li>
              <li>Scrape or copy content without permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
            <p>The Nimart name, logo, and all related design, text, graphics, and code are the property of Nimart and are protected by Nigerian and international copyright laws. You may not use our intellectual property without prior written consent.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, Nimart shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Platform. Our total liability to you for any claim shall not exceed the amount you paid to Nimart in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Indemnification</h2>
            <p>You agree to indemnify and hold Nimart harmless from any claims, damages, losses, or expenses arising out of your use of the Platform, your violation of these Terms, or your interaction with other users.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising shall be subject to the exclusive jurisdiction of the courts located in Abuja, Nigeria.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Changes to Terms</h2>
            <p>We may update these Terms from time to time. We will notify users of material changes via email or a notice on the Platform. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
            <p>For questions about these Terms, please contact us at <a href="mailto:support@nimart.ng" className="text-primary-600 hover:underline">support@nimart.ng</a>.</p>
          </section>
        </div>

        {/* Cross‑links to brand pages */}
        <div className="mt-12 border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">More about Nimart</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/about" className="text-primary-600 hover:underline flex items-center gap-1"><ArrowRight className="h-4 w-4" /> About Nimart</Link> – learn who we are and why we built this marketplace.</li>
            <li><Link href="/nimart-explained" className="text-primary-600 hover:underline flex items-center gap-1"><ArrowRight className="h-4 w-4" /> What is Nimart?</Link> – a quick introduction to the platform.</li>
            <li><Link href="/nimart-vs-nimart" className="text-primary-600 hover:underline flex items-center gap-1"><ArrowRight className="h-4 w-4" /> Nimart vs. NIMART</Link> – the difference between our service marketplace and the healthcare programme.</li>
          </ul>
        </div>
      </div>
    </>
  );
}