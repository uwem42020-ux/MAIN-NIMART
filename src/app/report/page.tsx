// src/app/report/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, Mail, Phone, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { SEO } from '@/components/common/SEO';

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Report an Issue – Nimart",
  "description": "Report safety concerns, suspicious activity, or platform issues to the Nimart team.",
  "url": "https://nimart.ng/report",
  "isPartOf": {
    "@type": "WebSite",
    "name": "Nimart",
    "url": "https://nimart.ng"
  }
};

export default function ReportPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    // Simulate submission (replace with actual API call)
    setTimeout(() => {
      toast.success('Thank you for your report. Our team will review it shortly.');
      setSubject('');
      setDescription('');
      setSubmitting(false);
      router.push('/');
    }, 1000);
  };

  return (
    <>
      <SEO
        title="Report an Issue | Nimart"
        description="Report safety concerns or issues on Nimart."
        keywords="report, issue, safety, Nimart"
        url="https://nimart.ng/report"
        schema={pageSchema}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Report' }
        ]}
      />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <Flag className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Report an Issue</h1>
          <p className="text-gray-600 mt-2">
            Let us know if you've encountered a problem or have a safety concern.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Quick Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-sm font-medium">Email Us Directly</p>
                <a href="mailto:safety@nimart.ng" className="text-primary-600 hover:underline">safety@nimart.ng</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-sm font-medium">Call Us</p>
                <a href="tel:+23438887589" className="text-primary-600 hover:underline">+234 388 875 89</a>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Suspicious activity, Bug report, Safety concern"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Please provide as much detail as possible. Include names, dates, and any relevant information."
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                If this is an emergency or you feel you're in immediate danger, please contact local authorities.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}