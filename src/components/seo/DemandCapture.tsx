// src/components/seo/DemandCapture.tsx
'use client';

import { useState } from 'react';
import { db } from '@/lib/supabase-any';
import { MapPin, Bell, CheckCircle2, Briefcase } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export function DemandCapture({ 
  categoryName, 
  locationName, 
  categorySlug, 
  lgaId, 
  stateName 
}: { 
  categoryName: string; 
  locationName: string; 
  categorySlug: string; 
  lgaId?: string; 
  stateName?: string; 
}) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    
    // Save to waitlist
    const { error } = await db.from('demand_waitlist').insert({
      email,
      category_slug: categorySlug,
      lga_id: lgaId ? parseInt(lgaId) : null,
      state_name: stateName || null
    });

    setLoading(false);
    if (error) {
      toast.error('Failed to save your email. Please try again.');
    } else {
      setSubmitted(true);
      toast.success("We'll notify you!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 sm:py-20 text-center">
      {/* Customer Waitlist Box */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 to-green-500" />
        
        <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <MapPin className="h-10 w-10 text-primary-600" />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          No {categoryName} available in {locationName} yet.
        </h1>
        <p className="text-gray-600 mb-8 max-w-lg mx-auto">
          We are currently expanding to {locationName}. Want us to email you as soon as a verified {categoryName} joins Nimart?
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-black transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Notify Me'}
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-2 text-green-600 font-semibold bg-green-50 py-3.5 px-6 rounded-xl max-w-md mx-auto">
            <CheckCircle2 className="h-5 w-5" />
            You're on the list! We'll email you soon.
          </div>
        )}
      </div>

      {/* Provider Acquisition Box */}
      <div className="bg-gray-900 rounded-3xl shadow-xl p-8 sm:p-12 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Are you a {categoryName} in {locationName}?</h2>
          <p className="text-gray-300 mb-6 max-w-lg mx-auto">
            Customers are actively searching for your services in this area. Be the first provider to claim this page.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 text-sm font-medium">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">✓ 1,000 Free Nicoins</span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">✓ Verified Badge</span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">✓ Free Boost</span>
          </div>
          <Link
            href={`/auth/signup?role=provider&category=${categorySlug}${lgaId ? `&lga=${lgaId}` : ''}${stateName ? `&state=${stateName}` : ''}`}
            className="inline-block bg-green-500 text-white font-bold text-lg px-8 py-4 rounded-xl hover:bg-green-400 transition transform hover:scale-105 shadow-lg shadow-green-500/30"
          >
            Claim This Page Now →
          </Link>
        </div>
      </div>
    </div>
  );
}