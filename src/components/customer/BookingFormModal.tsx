// src/components/BookingFormModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { X, Calendar, Clock, MapPin, FileText, Loader2, Shield, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import { sendEmail, sendPushNotification } from '@/lib/email';
import { providerNewBookingEmail, customerBookingConfirmationEmail } from '@/lib/emailTemplates';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
  providerVerified: boolean;
}

export function BookingFormModal({ isOpen, onClose, providerId, providerName, providerVerified }: BookingFormModalProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [formData, setFormData] = useState({
    serviceName: '',
    bookingDate: format(new Date(), 'yyyy-MM-dd'),
    bookingTime: '10:00',
    duration: 60,
    location: profile?.lga_name || '',
    specialInstructions: '',
  });

  // Capture GPS silently
  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // GPS not available – that's fine
        }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to book');
      return;
    }

    setLoading(true);
    try {
      // Basic VPN check
      let vpnDetected = false;
      try {
        const ipRes = await fetch('https://ipapi.co/json/');
        const ipData = await ipRes.json();
        vpnDetected = ipData?.proxy === true || ipData?.hosting === true || false;
      } catch {}

      const receiptToken = crypto.randomUUID();

      const { error } = await supabase.from('bookings').insert({
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

      // ---- Send styled email + push to provider ----
      const { data: providerProfile } = await supabase
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

      // ---- Send styled email + push to customer ----
      if (user.email) {
        await sendEmail(
          user.email,
          `Booking Submitted – ${formData.serviceName}`,
          customerBookingConfirmationEmail({
            providerName: providerName,
            serviceName: formData.serviceName,
            bookingDate: formData.bookingDate,
            bookingTime: formData.bookingTime,
            location: formData.location,
          })
        );
      }

      const { data: customerProfile } = await supabase
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

      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Book Service</h2>
            <p className="text-sm text-gray-500 mt-0.5">{providerName}</p>
            {!providerVerified && (
              <div className="flex items-center gap-1 mt-2 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-lg">
                <Shield className="h-3.5 w-3.5" />
                Provider not yet verified — your booking is still protected
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
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
    </div>
  );
}