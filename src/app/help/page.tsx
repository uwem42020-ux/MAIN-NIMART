// src/app/help/page.tsx
import Link from 'next/link';
import { Mail, Phone, HelpCircle, BookOpen, Shield, CreditCard } from 'lucide-react';
import { SEO } from '@/components/common/SEO';

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Help Center – Nimart",
  "description": "Find answers to common questions about Nimart, Nigeria's service marketplace. Contact support or browse FAQs.",
  "url": "https://nimart.ng/help",
  "isPartOf": {
    "@type": "WebSite",
    "name": "Nimart",
    "url": "https://nimart.ng"
  }
};

export default function HelpPage() {
  const faqs = [
    { q: 'How do I book a service?', a: 'Search for a provider, visit their profile, and click "Book Now". Fill in the details and submit. The provider will confirm your booking.' },
    { q: 'How do I become a Provider?', a: 'Sign up for an account, select "Offer Services", and complete the setup process. You will need to provide your location, business details, and portfolio images.' },
    { q: 'Is Nimart free?', a: 'Yes, creating an account and browsing is free. Providers may purchase optional boosts to increase visibility. Transaction fees may apply in the future.' },
    { q: 'How do I reset my password?', a: 'On the sign‑in page, click "Forgot password?" and follow the instructions sent to your email.' },
    { q: 'How do I contact a Provider?', a: 'You can use the "Message" button on their profile to start an in‑app chat.' },
    { q: 'What if a Provider cancels my booking?', a: 'You will be notified. You can search for another provider. No payment is processed until the service is confirmed.' },
  ];

  return (
    <>
      <SEO
        title="Help Center | Nimart"
        description="Find answers to common questions or contact Nimart support."
        url="https://nimart.ng/help"
        schema={pageSchema}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Help' }
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Help Center</h1>
        <p className="text-gray-600 mb-8">Find answers to common questions or contact our support team.</p>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <Mail className="h-8 w-8 text-primary-600 mx-auto mb-3" />
            <h3 className="font-semibold">Email Us</h3>
            <a href="mailto:support@nimart.ng" className="text-primary-600 hover:underline">support@nimart.ng</a>
            <p className="text-xs text-gray-500 mt-1">Response within 24 hours</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <Phone className="h-8 w-8 text-primary-600 mx-auto mb-3" />
            <h3 className="font-semibold">Call Us</h3>
            <a href="tel:+23438887589" className="text-primary-600 hover:underline">+234 388 875 89</a>
            <p className="text-xs text-gray-500 mt-1">Mon-Fri, 9am-5pm WAT</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <HelpCircle className="h-8 w-8 text-primary-600 mx-auto mb-3" />
            <h3 className="font-semibold">Live Chat</h3>
            <Link href="/customer/messages" className="text-primary-600 hover:underline">Open Support Chat</Link>
            <p className="text-xs text-gray-500 mt-1">Available for logged‑in users</p>
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary-600" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details key={idx} className="bg-white rounded-lg shadow-sm border p-4 group">
                <summary className="font-medium text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-primary-600 group-open:rotate-90 transition">▼</span>
                </summary>
                <p className="mt-3 text-gray-600 border-t pt-3">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Guides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary-600" />
              Safety Guidelines
            </h3>
            <p className="text-gray-600 mb-4">Learn how to stay safe while using Nimart.</p>
            <Link href="/safety" className="text-primary-600 hover:underline">Read Safety Tips →</Link>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary-600" />
              Payments & Pricing
            </h3>
            <p className="text-gray-600 mb-4">Understand how payments work and our pricing structure.</p>
            <Link href="/terms" className="text-primary-600 hover:underline">View Terms →</Link>
          </div>
        </div>

        {/* Cross‑links to brand pages */}
        <div className="mt-10 border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">More about Nimart</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/about" className="text-primary-600 hover:underline">About Nimart</Link> – learn who we are and why we built this marketplace.</li>
            <li><Link href="/nimart-explained" className="text-primary-600 hover:underline">What is Nimart?</Link> – a quick introduction to the platform.</li>
            <li><Link href="/nimart-vs-nimart" className="text-primary-600 hover:underline">Nimart vs. NIMART</Link> – the difference between our service marketplace and the healthcare programme.</li>
          </ul>
        </div>
      </div>
    </>
  );
}