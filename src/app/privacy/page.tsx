// src/app/privacy/page.tsx
import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { SEO } from '@/components/common/SEO';

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Privacy Policy – Nimart",
  "description": "Learn how Nimart collects, uses, and protects your personal data. Compliant with Nigeria's NDPR.",
  "url": "https://nimart.ng/privacy",
  "isPartOf": {
    "@type": "WebSite",
    "name": "Nimart",
    "url": "https://nimart.ng"
  }
};

export default function PrivacyPage() {
  return (
    <>
      <SEO
        title="Privacy Policy | Nimart"
        description="Learn how Nimart collects, uses, and protects your personal data. Compliant with Nigeria's NDPR."
        keywords="privacy, data protection, NDPR, personal data, Nimart privacy"
        url="https://nimart.ng/privacy"
        schema={pageSchema}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Privacy' }
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-full">
            <ShieldCheck className="h-6 w-6 text-blue-700" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Privacy Policy</h1>
        </div>
        <p className="text-gray-500 mb-8">
          Last updated: {new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly, such as your name, email address, phone number, and profile picture when you register. We also collect information about your interactions with the Platform, including bookings, messages, and reviews. Additionally, we may collect location data if you grant permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Provide and improve the Platform.</li>
              <li>Facilitate communication between Customers and Providers.</li>
              <li>Process transactions and send notifications.</li>
              <li>Ensure safety and security.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Sharing Your Information</h2>
            <p>We do not sell your personal information. We may share information with:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Service Providers:</strong> To facilitate a booking, we share your name and contact details with the Provider (or Customer) you are transacting with.</li>
              <li><strong>Service Providers (Vendors):</strong> We use third-party services like Supabase (database) and Resend (email). These vendors only access data necessary to perform their functions.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Retention</h2>
            <p>We retain your personal information for as long as your account is active or as needed to provide services. We may retain certain data for legal or legitimate business purposes even after account deletion.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Security</h2>
            <p>We implement reasonable security measures to protect your information. However, no method of transmission over the internet is 100% secure. We encourage you to use strong passwords and keep your credentials confidential.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Your Rights (NDPR Compliance)</h2>
            <p>Under the Nigeria Data Protection Regulation (NDPR), you have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Access and obtain a copy of your personal data.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data ("right to be forgotten").</li>
              <li>Object to or restrict processing of your data.</li>
              <li>Withdraw consent at any time.</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at <a href="mailto:privacy@nimart.ng" className="text-primary-600 hover:underline">privacy@nimart.ng</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Cookies</h2>
            <p>We use cookies to improve your experience. You can control cookies through your browser settings. See our <Link href="/cookies" className="text-primary-600 hover:underline">Cookie Policy</Link> for details.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Children's Privacy</h2>
            <p>The Platform is not intended for anyone under the age of 18. We do not knowingly collect information from minors.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. We will notify you of material changes via email or a notice on the Platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
            <p>For privacy-related inquiries, contact our Data Protection Officer at <a href="mailto:privacy@nimart.ng" className="text-primary-600 hover:underline">privacy@nimart.ng</a> or write to: Shop E35 Murg Plaza, Area 10 UTC, Abuja, Nigeria.</p>
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