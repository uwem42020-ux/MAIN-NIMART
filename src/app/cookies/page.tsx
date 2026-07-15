// src/app/cookies/page.tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SEO } from '@/components/common/SEO';

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Cookie Policy – Nimart",
  "description": "Learn about how Nimart uses cookies on its platform.",
  "url": "https://nimart.ng/cookies",
  "isPartOf": {
    "@type": "WebSite",
    "name": "Nimart",
    "url": "https://nimart.ng"
  }
};

export default function CookiesPage() {
  return (
    <>
      <SEO
        title="Cookie Policy | Nimart"
        description="Learn about how Nimart uses cookies."
        keywords="cookies, cookie policy, Nimart"
        url="https://nimart.ng/cookies"
        schema={pageSchema}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Cookies' }
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
        <p className="text-gray-600 mb-4">
          Last updated: {new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold mb-3">What Are Cookies?</h2>
            <p>
              Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work efficiently and provide information to site owners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">How Nimart Uses Cookies</h2>
            <p>We use cookies to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Essential Cookies:</strong> Necessary for the Platform to function (e.g., keeping you logged in).</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences.</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how users interact with the Platform (e.g., page views, clicks).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Third-Party Cookies</h2>
            <p>
              We use third-party services like Supabase and Google Fonts that may set their own cookies. We do not control these cookies. Please review the respective privacy policies of these services for more information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Managing Cookies</h2>
            <p>Most browsers allow you to refuse or delete cookies. Instructions for common browsers:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Safari</a></li>
            </ul>
            <p className="mt-2">Please note that disabling essential cookies may affect the functionality of the Platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
            <p>
              For questions about our use of cookies, contact{' '}
              <a href="mailto:support@nimart.ng" className="text-primary-600 hover:underline">support@nimart.ng</a>.
            </p>
          </section>
        </div>

        {/* Cross‑links */}
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