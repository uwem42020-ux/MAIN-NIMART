// app/book/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Loader2,
  Shield,
  Navigation,
  ArrowLeft,
  Star,
} from 'lucide-react';
import { format } from 'date-fns';
import { sendEmail, sendPushNotification } from '@/lib/email';
import { providerNewBookingEmail, customerBookingConfirmationEmail } from '@/lib/emailTemplates';

export default function BookProviderPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();

  const providerId = params?.id as string;

  const [provider, setProvider] = useState<any>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [formData, setFormData] = useState({
    serviceName: '',
    bookingDate: format(new Date(), 'yyyy-MM-dd'),
    bookingTime: '10:00',
    duration: 60,
    location: profile?.lga_name || '',
    specialInstructions: '',
  });

  // Redirect to sign‑in if not logged in
  useEffect(() => {
    if (!user) {
      router.push(`/auth/signin?redirect=/book/${providerId}`);
    }
  }, [user, router, providerId]);

  // Fetch provider details
  useEffect(() => {
    if (!providerId) return;

    (async () => {
      setLoadingPage(true);
      const { data: prov, error } = await db
        .from('providers')
        .select('*')
        .eq('id', providerId)
        .single();

      if (error || !prov) {
        toast.error('Provider not found');
        router.push('/');
        return;
      }

      // Also fetch the provider’s profile for name/rating/avatar
      const { data: profileData } = await db
        .from('profiles')
        .select('full_name, avatar_url, lat, lng, lga_name')
        .eq('id', providerId)
        .single();

      setProvider({ ...(prov as any), profile: profileData || null });
      setLoadingPage(false);
    })();
  }, [providerId, router]);

  // Capture GPS silently
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {}
      );
    }
  }, []);

  if (loadingPage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!provider) return null; // already redirected

  const isAvailable = provider.status === 'available';
  const providerName =
    provider.business_name ||
    provider.profile?.full_name ||
    'Provider';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to book');
      return;
    }

    setLoadingSubmit(true);
    try {
      // Basic VPN check
      let vpnDetected = false;
      try {
        const ipRes = await fetch('https://ipapi.co/json/');
        const ipData = await ipRes.json();
        vpnDetected = ipData?.proxy === true || ipData?.hosting === true || false;
      } catch {}

      const receiptToken = crypto.randomUUID();

      const { error } = await db.from('bookings').insert({
        customer_id: user.id,
        provider_id: providerId,
        service_name: formData.serviceName,
        booking_date: formData.bookingDate,
        booking_time: formData.bookingTime,
        duration_minutes: formData.duration,
        location: formData.location,
        special_instructions: formData.specialInstructions,
        status: 'pending',
        customer_gps_lat: gpsCoords?.lat || null,
        customer_gps_lng: gpsCoords?.lng || null,
        vpn_detected: vpnDetected,
        receipt_token: receiptToken,
      });

      if (error) throw error;

      toast.success('Booking request sent!');

      // ---- Notifications (email + push) ----
      const { data: providerProfile } = await db
        .from('profiles')
        .select('email, fcm_token')
        .eq('id', providerId)
        .single();

      if (providerProfile?.email) {
        await sendEmail(
          providerProfile.email,
          `New Booking Request – ${formData.serviceName}`,
          providerNewBookingEmail({
            serviceName: formData.serviceName,
            bookingDate: formData.bookingDate,
            bookingTime: formData.bookingTime,
            location: formData.location,
          })
        );
      }

      if (providerProfile?.fcm_token) {
        await sendPushNotification(
          providerProfile.fcm_token,
          'New Booking Request',
          `${formData.serviceName} — ${formData.bookingDate} at ${formData.bookingTime}`
        );
      }

      if (user.email) {
        await sendEmail(
          user.email,
          `Booking Submitted – ${formData.serviceName}`,
          customerBookingConfirmationEmail({
            providerName,
            serviceName: formData.serviceName,
            bookingDate: formData.bookingDate,
            bookingTime: formData.bookingTime,
            location: formData.location,
          })
        );
      }

      const { data: customerProfile } = await db
        .from('profiles')
        .select('fcm_token')
        .eq('id', user.id)
        .single();

      if (customerProfile?.fcm_token) {
        await sendPushNotification(
          customerProfile.fcm_token,
          'Booking Submitted',
          `Your booking for ${formData.serviceName} has been sent to ${providerName}.`
        );
      }

      // Redirect to customer bookings page
      router.push('/customer/bookings');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Provider info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="flex items-center gap-4">
          {provider.profile?.avatar_url ? (
            <img
              src={provider.profile.avatar_url}
              alt=""
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-semibold text-xl">
                {providerName[0]}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{providerName}</h1>
            <p className="text-sm text-gray-500">
              {provider.profile?.lga_name || 'Location not set'}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium">{provider.rating || 'New'}</span>
            </div>
          </div>
        </div>
        {!isAvailable && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
            <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              This provider is currently <strong>not available</strong>. You can still send a
              booking request, but they may respond later.
            </p>
          </div>
        )}
      </div>

      {/* Booking form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Booking Details</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Service Needed <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.serviceName}
            onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-gray-900 placeholder-gray-400"
            placeholder="e.g., Engine repair, Hair styling..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Calendar className="inline h-4 w-4 mr-1" /> Date
            </label>
            <input
              type="date"
              required
              min={format(new Date(), 'yyyy-MM-dd')}
              value={formData.bookingDate}
              onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
              className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Clock className="inline h-4 w-4 mr-1" /> Time
            </label>
            <input
              type="time"
              required
              value={formData.bookingTime}
              onChange={(e) => setFormData({ ...formData, bookingTime: e.target.value })}
              className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration</label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-gray-900"
          >
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
            <option value={180}>3 hours</option>
            <option value={300}>5 hours (multi-day)</option>
            <option value={480}>8 hours (full day)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <MapPin className="inline h-4 w-4 mr-1" /> Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-gray-900 placeholder-gray-400"
            placeholder="Your address or area"
          />
          {gpsCoords && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <Navigation className="h-3 w-3" /> Location recorded for safety
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <FileText className="inline h-4 w-4 mr-1" /> Special Instructions
          </label>
          <textarea
            value={formData.specialInstructions}
            onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-gray-900 placeholder-gray-400 resize-none"
            placeholder="Any additional details..."
          />
        </div>

        {/* Safety notice */}
        <div className="bg-yellow-50 rounded-xl p-3 flex items-start gap-2">
          <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-800">
            <strong>Safety tip:</strong> Do not pay in full before the work is done.
            For multi-day jobs, agree on milestone payments. If the provider demands full upfront payment, report it.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loadingSubmit}
            className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingSubmit ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Booking...
              </>
            ) : (
              'Confirm Booking'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}