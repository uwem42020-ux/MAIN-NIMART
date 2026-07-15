// src/app/receipt/[token]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, User, Briefcase, Shield, QrCode, Download } from 'lucide-react';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import { useRef, useState } from 'react';

const LOGO_URL = 'https://qootzfndochmcoijnwxf.supabase.co/storage/v1/object/public/logo/logo.png';

export default function BookingReceiptPage() {
  const params = useParams();
  const token = params.token as string;

  const receiptRef = useRef<HTMLDivElement>(null);
  const [showOptions, setShowOptions] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking-receipt', token],
    queryFn: async () => {
      if (!token) return null;

      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('receipt_token', token)
        .single();

      if (bookingError || !bookingData) return null;

      const { data: providerData } = await supabase
        .from('providers')
        .select('business_name')
        .eq('id', bookingData.provider_id)
        .maybeSingle();

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', [bookingData.provider_id, bookingData.customer_id]);

      const providerProfile = profilesData?.find(p => p.id === bookingData.provider_id);
      const customerProfile = profilesData?.find(p => p.id === bookingData.customer_id);

      return {
        ...bookingData,
        provider_business: providerData?.business_name || null,
        provider_name: providerProfile?.full_name || null,
        provider_phone: providerProfile?.phone || null,
        customer_name: customerProfile?.full_name || null,
        customer_phone: customerProfile?.phone || null,
      };
    },
    enabled: !!token,
  });

  const handleDownloadPDF = async () => {
    setShowOptions(false);
    if (!receiptRef.current) return;
    const html2pdf = (await import('html2pdf.js')).default;
    const element = receiptRef.current;
    const options = {
      margin: 0.5,
      filename: `Nimart-Receipt-${booking?.booking_number || 'booking'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
    };
    html2pdf().set(options).from(element).save();
  };

  const handleDownloadImage = async () => {
    setShowOptions(false);
    if (!receiptRef.current) return;
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(receiptRef.current, { scale: 2 });
    const link = document.createElement('a');
    link.download = `Nimart-Receipt-${booking?.booking_number || 'booking'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (isLoading) return <div className="flex justify-center py-16"><NimartSpinner size="lg" /></div>;
  if (!booking) return <div className="text-center py-16 text-gray-500">Receipt not found</div>;

  const providerDisplayName = booking.provider_business || booking.provider_name || 'Provider';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Download button with dropdown */}
      <div className="flex justify-end mb-4 relative">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition text-sm font-medium"
        >
          <Download className="h-4 w-4" /> Download
        </button>

        {showOptions && (
          <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border py-2 w-48 z-20">
            <button onClick={handleDownloadPDF} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
              📄 Download as PDF
            </button>
            <button onClick={handleDownloadImage} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
              🖼️ Download as Image
            </button>
          </div>
        )}
      </div>

      {/* Receipt with watermark */}
      <div className="relative">
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
          backgroundImage: `url(${LOGO_URL})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px',
          backgroundPosition: 'center',
        }} />

        <div ref={receiptRef} className="relative z-10">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-primary-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <img src={LOGO_URL} alt="Nimart" className="h-10 w-auto mb-2" />
                  <h1 className="text-2xl font-bold">Booking Receipt</h1>
                  <p className="text-primary-100 text-sm mt-1">Nimart Service Marketplace</p>
                </div>
                <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
                  <QrCode className="h-16 w-16 mx-auto text-white" />
                  <p className="text-[10px] text-primary-100 mt-1">Scan to verify</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Booking Number</span>
                <span className="text-lg font-bold font-mono text-gray-900">{booking.booking_number}</span>
              </div>

              <hr className="border-gray-100" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1"><User className="h-3.5 w-3.5" /> Provider</div>
                  <p className="font-semibold text-gray-900">{providerDisplayName}</p>
                  {booking.provider_phone && <p className="text-sm text-primary-600">{booking.provider_phone}</p>}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1"><User className="h-3.5 w-3.5" /> Customer</div>
                  <p className="font-semibold text-gray-900">{booking.customer_name || 'Customer'}</p>
                  {booking.customer_phone && <p className="text-sm text-primary-600">{booking.customer_phone}</p>}
                </div>
              </div>

              <hr className="border-gray-100" />

              <div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1"><Briefcase className="h-3.5 w-3.5" /> Service</div>
                <p className="font-semibold text-gray-900">{booking.service_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-1.5 text-gray-600"><Calendar className="h-4 w-4 text-primary-500" /> {format(new Date(booking.booking_date), 'PPP')}</div>
                <div className="flex items-center gap-1.5 text-gray-600"><Clock className="h-4 w-4 text-primary-500" /> {booking.booking_time} ({booking.duration_minutes} min)</div>
                <div className="flex items-center gap-1.5 text-gray-600 col-span-2"><MapPin className="h-4 w-4 text-primary-500" /> {booking.location}</div>
              </div>

              <hr className="border-gray-100" />

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Status</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">{booking.status.replace(/_/g, ' ')}</span>
              </div>

              {booking.special_instructions && (
                <>
                  <hr className="border-gray-100" />
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Special Instructions</div>
                    <p className="text-sm text-gray-700 italic">{booking.special_instructions}</p>
                  </div>
                </>
              )}

              <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-2 mt-4">
                <Shield className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500">
                  Nimart connects customers with service providers. Payment and service terms are agreed directly between both parties.
                  Nimart provides dispute mediation but is not responsible for the outcome of individual services.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}