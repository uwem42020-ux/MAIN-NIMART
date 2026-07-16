// src/app/provider/bookings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';
import {
  Calendar, Clock, MapPin, CheckCircle, XCircle, MessageCircle, Phone,
  AlertCircle, RefreshCw, ChevronDown, Loader2, Share2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookingStatusTimeline } from '@/components/common/BookingStatusTimeline';
import { sendEmail, sendPushNotification } from '@/lib/email';
import { REFERRAL_BONUS } from '@/lib/nicoinConfig';

interface Booking {
  id: string;
  booking_number: string;
  customer_id: string;
  provider_id: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  price: number | null;
  location: string;
  special_instructions: string | null;
  status: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_avatar: string | null;
  customer_confirmation_status: string;
  dispute_reason: string | null;
  receipt_token: string | null;
}

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled_by_customer: 'bg-red-100 text-red-800 border-red-200',
  cancelled_by_provider: 'bg-red-100 text-red-800 border-red-200',
  no_show: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function ProviderBookings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPastBookings, setShowPastBookings] = useState(false);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['provider-bookings', user?.id, activeTab],
    queryFn: async () => {
      if (!user) return [];
      let query = db
        .from('bookings')
        .select('*')
        .eq('provider_id', user.id)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (activeTab === 'cancelled') {
        query = query.in('status', ['cancelled_by_customer', 'cancelled_by_provider']);
      } else if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      const { data: bookingsData, error } = await query;
      if (error || !bookingsData?.length) return [];

      const bookingsArray = bookingsData as any[];
      const customerIds = [...new Set(bookingsArray.map(b => b.customer_id))];

      const { data: profiles } = await db
        .from('profiles')
        .select('id, full_name, phone, avatar_url')
        .in('id', customerIds);

      const profileMap = new Map((profiles as any[])?.map(p => [p.id, p]) || []);

      return bookingsArray.map(booking => ({
        ...booking,
        customer_name: profileMap.get(booking.customer_id)?.full_name || null,
        customer_phone: profileMap.get(booking.customer_id)?.phone || null,
        customer_avatar: profileMap.get(booking.customer_id)?.avatar_url || null,
      })) as Booking[];
    },
    enabled: !!user,
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('provider-bookings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `provider_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ['provider-bookings', user.id] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel).catch(console.warn); };
  }, [user, queryClient]);

  const counts = bookings ? {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    in_progress: bookings.filter(b => b.status === 'in_progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status.startsWith('cancelled')).length,
  } : {};

  const updateStatus = async (bookingId: string, newStatus: string, booking: Booking) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'in_progress') updates.provider_started_at = new Date().toISOString();
    if (newStatus === 'completed') updates.completed_at = new Date().toISOString();
    if (newStatus.startsWith('cancelled')) {
      updates.cancelled_at = new Date().toISOString();
      updates.cancelled_by = user?.id;
    }

    setActionLoading(bookingId);
    const { error } = await db.from('bookings').update(updates).eq('id', bookingId);
    setActionLoading(null);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Booking ${newStatus.replace(/_/g, ' ')}`);
    queryClient.invalidateQueries({ queryKey: ['provider-bookings', user?.id] });

    if (newStatus === 'completed') {
      const { data: customerProfile } = await db
        .from('profiles')
        .select('email, fcm_token')
        .eq('id', booking.customer_id)
        .single();

      if (customerProfile?.email) {
        await sendEmail(
          customerProfile.email,
          'Your Booking Has Been Completed',
          `<h2>${booking.service_name} has been marked as completed</h2>
           <p>Please confirm the job and leave a review for the provider.</p>`
        );
      }

      if (customerProfile?.fcm_token) {
        await sendPushNotification(
          customerProfile.fcm_token,
          'Booking Completed',
          `${booking.service_name} has been marked as completed. Please confirm the job.`
        );
      }

      const { count: completedCount } = await db
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', booking.provider_id)
        .eq('status', 'completed');

      if (completedCount === 1) {
        const { data: referral } = await db
          .from('referrals')
          .select('id, referrer_id, status')
          .eq('referred_provider_id', booking.provider_id)
          .eq('status', 'pending')
          .single();

        if (referral) {
          await db.rpc('adjust_coin_balance', {
            p_provider_id: referral.referrer_id,
            p_amount: REFERRAL_BONUS,
          });
          await db.rpc('adjust_coin_balance', {
            p_provider_id: booking.provider_id,
            p_amount: REFERRAL_BONUS,
          });

          await db
            .from('referrals')
            .update({ status: 'awarded', awarded_at: new Date().toISOString() })
            .eq('id', referral.id);
        }
      }
    }
  };

  const formatBookingDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return `Today, ${format(date, 'MMM d')}`;
    if (isTomorrow(date)) return `Tomorrow, ${format(date, 'MMM d')}`;
    if (isThisWeek(date, { weekStartsOn: 1 })) return format(date, 'EEEE, MMM d');
    return format(date, 'MMM d, yyyy');
  };

  const shareReceipt = (token: string) => {
    const url = `${window.location.origin}/receipt/${token}`;
    if (navigator.share) {
      navigator.share({ title: 'Booking Receipt', url }).catch(() => {
        navigator.clipboard.writeText(url).then(() => toast.success('Receipt link copied!'));
      });
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success('Receipt link copied!'));
    }
  };

  const activeBookings = bookings?.filter(b => !['completed', 'cancelled_by_customer', 'cancelled_by_provider', 'no_show'].includes(b.status));
  const pastBookings = bookings?.filter(b => ['completed', 'cancelled_by_customer', 'cancelled_by_provider', 'no_show'].includes(b.status));

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Bookings</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Bookings</h1>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition',
              activeTab === tab.key
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {tab.label}
            {(counts as any)?.[tab.key] > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 text-white rounded-full">
                {(counts as any)[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {!bookings?.length ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <Calendar className="mx-auto h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-lg font-semibold text-gray-700">No bookings found</h2>
          <p className="mt-2 text-gray-500">Make your profile attractive to get more bookings</p>
        </div>
      ) : (
        <>
          {activeBookings?.map(booking => (
            <BookingCard
              key={booking.id}
              booking={booking}
              expandedBooking={expandedBooking}
              setExpandedBooking={setExpandedBooking}
              actionLoading={actionLoading}
              updateStatus={updateStatus}
              shareReceipt={shareReceipt}
              formatBookingDate={formatBookingDate}
            />
          ))}

          {pastBookings && pastBookings.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowPastBookings(!showPastBookings)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                <ChevronDown className={cn('h-4 w-4 transition', showPastBookings && 'rotate-180')} />
                {showPastBookings ? 'Hide past bookings' : `View past bookings (${pastBookings.length})`}
              </button>

              {showPastBookings && (
                <div className="mt-3 space-y-4">
                  {pastBookings.map(booking => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      expandedBooking={expandedBooking}
                      setExpandedBooking={setExpandedBooking}
                      actionLoading={actionLoading}
                      updateStatus={updateStatus}
                      shareReceipt={shareReceipt}
                      formatBookingDate={formatBookingDate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  expandedBooking,
  setExpandedBooking,
  actionLoading,
  updateStatus,
  shareReceipt,
  formatBookingDate,
}: {
  booking: Booking;
  expandedBooking: string | null;
  setExpandedBooking: (id: string | null) => void;
  actionLoading: string | null;
  updateStatus: (id: string, status: string, booking: Booking) => Promise<void>;
  shareReceipt: (token: string) => void;
  formatBookingDate: (date: string) => string;
}) {
  const isPendingConfirmation = booking.status === 'completed' && booking.customer_confirmation_status === 'pending';
  const isDisputed = booking.customer_confirmation_status === 'disputed';

  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition',
        booking.status.startsWith('cancelled') && 'opacity-60'
      )}
    >
      <BookingStatusTimeline
        currentStatus={booking.status}
        customerConfirmationStatus={booking.customer_confirmation_status}
        size="sm"
      />

      <div className="mt-4 flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-3 sm:w-48 flex-shrink-0">
          {booking.customer_avatar ? (
            <img src={booking.customer_avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-semibold text-lg">{booking.customer_name?.[0] || '?'}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{booking.customer_name || 'Unknown'}</p>
            {booking.customer_phone && (
              <a href={`tel:${booking.customer_phone}`} className="text-xs text-primary-600 hover:underline">{booking.customer_phone}</a>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-sm font-bold text-gray-800 font-mono tracking-wide">{booking.booking_number}</span>
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border', statusColors[booking.status])}>
              {booking.status.replace(/_/g, ' ')}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">{booking.service_name}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-1"><Calendar className="h-4 w-4 text-primary-500" />{formatBookingDate(booking.booking_date)}</div>
            <div className="flex items-center gap-1"><Clock className="h-4 w-4 text-primary-500" />{booking.booking_time} ({booking.duration_minutes} min)</div>
            <div className="flex items-center gap-1"><MapPin className="h-4 w-4 text-primary-500" />{booking.location}</div>
          </div>
          {booking.price && <p className="mt-2 text-sm font-semibold">₦{booking.price.toLocaleString()}</p>}
          {booking.special_instructions && (
            <button onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
              className="mt-2 flex items-center gap-1 text-sm text-primary-600 hover:underline">
              <ChevronDown className={cn('h-4 w-4 transition', expandedBooking === booking.id && 'rotate-180')} />
              {expandedBooking === booking.id ? 'Hide instructions' : 'View instructions'}
            </button>
          )}
          {expandedBooking === booking.id && booking.special_instructions && (
            <p className="mt-2 text-sm text-gray-500 italic bg-gray-50 rounded-lg px-3 py-1.5">"{booking.special_instructions}"</p>
          )}
          {isDisputed && booking.dispute_reason && (
            <div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm font-medium text-orange-800">Dispute reason:</p>
              <p className="text-sm text-orange-700 mt-1">{booking.dispute_reason}</p>
            </div>
          )}
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:w-40 flex-shrink-0">
          {booking.status === 'pending' && (
            <>
              <button onClick={() => updateStatus(booking.id, 'confirmed', booking)} disabled={actionLoading === booking.id}
                className="w-full flex items-center justify-center gap-1 px-3 py-2.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 text-sm font-medium transition active:scale-95 disabled:opacity-50">
                {actionLoading === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Accept
              </button>
              <button onClick={() => updateStatus(booking.id, 'cancelled_by_provider', booking)} disabled={actionLoading === booking.id}
                className="w-full flex items-center justify-center gap-1 px-3 py-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 text-sm font-medium transition active:scale-95 disabled:opacity-50">
                <XCircle className="h-4 w-4" /> Decline
              </button>
            </>
          )}
          {booking.status === 'confirmed' && (
            <button onClick={() => updateStatus(booking.id, 'in_progress', booking)} disabled={actionLoading === booking.id}
              className="w-full flex items-center justify-center gap-1 px-3 py-2.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 text-sm font-medium transition active:scale-95 animate-pulse disabled:opacity-50">
              {actionLoading === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Start Service
            </button>
          )}
          {booking.status === 'in_progress' && (
            <button onClick={() => updateStatus(booking.id, 'completed', booking)} disabled={actionLoading === booking.id}
              className="w-full flex items-center justify-center gap-1 px-3 py-2.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 text-sm font-medium transition active:scale-95 disabled:opacity-50">
              {actionLoading === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Mark Complete
            </button>
          )}
          {booking.status === 'completed' && booking.customer_confirmation_status === 'confirmed' && (
            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
              <CheckCircle className="h-4 w-4" /> Done & Confirmed
            </span>
          )}
          {isPendingConfirmation && (
            <div className="flex items-center gap-1 text-yellow-600 text-sm">
              <Clock className="h-4 w-4" /> Awaiting confirmation
            </div>
          )}
          {booking.receipt_token && (
            <button onClick={() => shareReceipt(booking.receipt_token!)}
              className="w-full flex items-center justify-center gap-1 px-3 py-2.5 bg-green-50 text-green-700 rounded-full hover:bg-green-100 text-sm font-medium transition active:scale-95">
              <Share2 className="h-4 w-4" /> Receipt
            </button>
          )}
        </div>
      </div>
    </div>
  );
}