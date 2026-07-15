// src/app/safety/page.tsx
import Link from 'next/link';
import {
  Shield,
  AlertTriangle,
  UserCheck,
  MapPin,
  CreditCard,
  MessageCircle,
  Eye,
  Phone,
  Mail,
  Flag,
  ArrowRight,
} from 'lucide-react';
import { SEO } from '@/components/common/SEO';

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Safety Tips – Nimart",
  "description": "Stay safe while using Nimart, Nigeria's service marketplace. Read our safety guidelines for customers and providers.",
  "url": "https://nimart.ng/safety",
  "isPartOf": {
    "@type": "WebSite",
    "name": "Nimart",
    "url": "https://nimart.ng"
  }
};

export default function SafetyPage() {
  return (
    <>
      <SEO
        title="Safety Tips | Nimart"
        description="Stay safe while using Nimart. Tips for customers and providers."
        keywords="safety, Nimart safety, Nigeria marketplace safety, customer safety, provider safety"
        url="https://nimart.ng/safety"
        schema={pageSchema}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Safety' }
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-yellow-100 p-3 rounded-full">
            <Shield className="h-6 w-6 text-yellow-700" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Safety Tips</h1>
        </div>
        <p className="text-gray-600 mb-8 text-lg">
          Your safety is our priority. Follow these guidelines to have a secure experience on Nimart.
        </p>

        {/* For Customers */}
        <div className="bg-yellow-50 rounded-2xl shadow-sm border border-yellow-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-yellow-800 flex items-center gap-2 mb-4">
            <UserCheck className="h-6 w-6" /> For Customers
          </h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-gray-900">Meet in safe, public locations.</strong>
                <p className="text-gray-600 text-sm">For in‑person services, choose well‑lit areas with people around. Avoid isolated spots.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <UserCheck className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-gray-900">Verify the Provider.</strong>
                <p className="text-gray-600 text-sm">Check reviews, ratings, and profile completeness. Use the in‑app chat to confirm details before meeting.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-gray-900">Avoid upfront full payment.</strong>
                <p className="text-gray-600 text-sm">Do not pay the entire amount before the service is satisfactorily completed. Negotiate a deposit or milestone payment.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-gray-900">Keep communication on the Platform.</strong>
                <p className="text-gray-600 text-sm">Use Nimart's chat system to maintain a record of all conversations. Avoid moving to WhatsApp or SMS too early.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-gray-900">Trust your instincts.</strong>
                <p className="text-gray-600 text-sm">If something feels off, cancel the booking and report the Provider to us.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* For Providers */}
        <div className="bg-blue-50 rounded-2xl shadow-sm border border-blue-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2 mb-4">
            <UserCheck className="h-6 w-6" /> For Providers
          </h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <UserCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-gray-900">Verify the Customer.</strong>
                <p className="text-gray-600 text-sm">Check the customer's profile and reviews (if any). Use the chat to clarify service expectations.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-gray-900">Meet in safe locations.</strong>
                <p className="text-gray-600 text-sm">If meeting at the customer's location, share your live location with a trusted contact.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-gray-900">Secure payment.</strong>
                <p className="text-gray-600 text-sm">Agree on payment terms before starting work. Consider requesting a small deposit for larger jobs.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-gray-900">Document your work.</strong>
                <p className="text-gray-600 text-sm">Take before‑and‑after photos to protect yourself in case of disputes.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Flag className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-gray-900">Report suspicious activity.</strong>
                <p className="text-gray-600 text-sm">If a customer makes you uncomfortable, block and report them immediately.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Report a Safety Concern */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-10">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" /> Report a Safety Concern
          </h2>
          <p className="text-gray-600 mb-4">
            If you experience or witness any unsafe behavior, harassment, or fraud, please report it immediately:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary-600" />
              <a href="mailto:safety@nimart.ng" className="text-primary-600 hover:underline text-sm">safety@nimart.ng</a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary-600" />
              <a href="tel:+23438887589" className="text-primary-600 hover:underline text-sm">+234 388 875 89</a>
            </div>
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary-600" />
              <span className="text-gray-700 text-sm">In‑app: Use the "Report" button</span>
            </div>
          </div>
        </div>

        {/* Cross‑links */}
        <div className="mt-10 border-t pt-6">
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