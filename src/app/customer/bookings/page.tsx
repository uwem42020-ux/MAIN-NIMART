// src/app/customer/bookings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';
import {
  Calendar, Clock, MapPin, Star, XCircle, MessageCircle,
  CheckCircle, AlertCircle, RefreshCw, ShieldAlert,
  ChevronDown, ThumbsUp, ThumbsDown, Loader2, Flag, Share2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookingStatusTimeline } from '@/components/common/BookingStatusTimeline';
import { FlagBookingModal } from '@/components/customer/FlagBookingModal';

interface Booking {
  id: string;
  booking_number: string;
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
  provider_name: string | null;
  provider_avatar: string | null;
  provider_business: string | null;
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

export default function CustomerBookings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [disputingId, setDisputingId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [flagBookingId, setFlagBookingId] = useState<string | null>(null);
  const [showPastBookings, setShowPastBookings] = useState(false);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['customer-bookings', user?.id, activeTab],
    queryFn: async () => {
      if (!user) return [];
      let query = db
        .from('bookings')
        .select('*')
        .eq('customer_id', user.id)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (activeTab === 'cancelled') {
        query = query.in('status', ['cancelled_by_customer', 'cancelled_by_provider']);
      } else if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      const { data: bookingsData, error } = await query;
      if (error || !bookingsData?.length) return [];

      const providerIds = [...new Set((bookingsData as any[]).map((b: any) => b.provider_id))];
      const [{ data: providers }, { data: profiles }] = await Promise.all([
        db.from('providers').select('id, business_name').in('id', providerIds),
        db.from('profiles').select('id, full_name, avatar_url').in('id', providerIds),
      ]);

      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);
      const providerMap = new Map(providers?.map((p: any) => [p.id, p]) || []);

      return (bookingsData as any[]).map((booking: any) => ({
        ...booking,
        provider_name: (profileMap.get(booking.provider_id) as any)?.full_name || null,
        provider_avatar: (profileMap.get(booking.provider_id) as any)?.avatar_url || null,
        provider_business: (providerMap.get(booking.provider_id) as any)?.business_name || null,
      })) as Booking[];
    },
    enabled: !!user,
    staleTime: 1000 * 30,
  });

  // Real-time
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('customer-bookings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `customer_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ['customer-bookings', user.id] })
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

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Cancel this booking?')) return;
    const { error } = await db
      .from('bookings')
      .update({ status: 'cancelled_by_customer', cancelled_at: new Date().toISOString(), cancelled_by: user?.id })
      .eq('id', bookingId);
    if (error) toast.error(error.message);
    else {
      toast.success('Booking cancelled');
      queryClient.invalidateQueries({ queryKey: ['customer-bookings', user?.id] });
    }
  };

  const handleConfirmCompletion = async (bookingId: string) => {
    setConfirmingId(bookingId);
    const { data, error } = await db
      .from('bookings')
      .update({
        customer_confirmed_at: new Date().toISOString(),
        customer_confirmation_status: 'confirmed'
      })
      .eq('id', bookingId)
      .select('id, customer_confirmation_status')
      .single();

    setConfirmingId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data) {
      toast.error('Booking not found. Please refresh and try again.');
      return;
    }

    toast.success('Thank you for confirming!');
    setShowPastBookings(true);
    queryClient.invalidateQueries({ queryKey: ['customer-bookings', user?.id] });
  };

  const handleDispute = async (bookingId: string) => {
    if (!disputeReason.trim()) {
      toast.error('Please provide a reason for the dispute');
      return;
    }
    setDisputingId(bookingId);
    const { error } = await db
      .from('bookings')
      .update({
        customer_confirmation_status: 'disputed',
        dispute_reason: disputeReason.trim()
      })
      .eq('id', bookingId);
    setDisputingId(null);
    setDisputeReason('');
    if (error) toast.error(error.message);
    else {
      toast.success('Dispute submitted. We will review it shortly.');
      queryClient.invalidateQueries({ queryKey: ['customer-bookings', user?.id] });
    }
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

  const formatBookingDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return `Today, ${format(date, 'MMM d')}`;
    if (isTomorrow(date)) return `Tomorrow, ${format(date, 'MMM d')}`;
    if (isThisWeek(date, { weekStartsOn: 1 })) return format(date, 'EEEE, MMM d');
    return format(date, 'MMM d, yyyy');
  };

  const activeBookings = bookings?.filter(
    b => !['cancelled_by_customer', 'cancelled_by_provider', 'no_show'].includes(b.status) &&
         !(b.status === 'completed' && b.customer_confirmation_status === 'confirmed')
  );
  const pastBookings = bookings?.filter(
    b => ['cancelled_by_customer', 'cancelled_by_provider', 'no_show'].includes(b.status) ||
        (b.status === 'completed' && b.customer_confirmation_status === 'confirmed')
  );

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

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
          <p className="mt-2 text-gray-500">Find a service provider and make your first booking</p>
          <Link
            href="/search"
            className="mt-4 inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition font-medium"
          >
            Find Providers
          </Link>
        </div>
      ) : (
        <>
          {activeBookings?.map(booking => (
            <div
              key={booking.id}
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
                  {booking.provider_avatar ? (
                    <img src={booking.provider_avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-lg">{booking.provider_name?.[0] || '?'}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <Link href={`/provider/${booking.provider_id}`} className="font-semibold text-gray-900 hover:text-primary-600 truncate block">
                      {booking.provider_business || booking.provider_name || 'Unknown Provider'}
                    </Link>
                    <p className="text-xs text-gray-500 truncate">{booking.service_name}</p>
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
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:w-40 flex-shrink-0">
                  {booking.status === 'pending' && (
                    <button onClick={() => handleCancel(booking.id)}
                      className="w-full flex items-center justify-center gap-1 px-3 py-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 text-sm font-medium transition active:scale-95">
                      <XCircle className="h-4 w-4" /> Cancel
                    </button>
                  )}

                  {booking.status === 'completed' && booking.customer_confirmation_status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleConfirmCompletion(booking.id)}
                        disabled={confirmingId === booking.id}
                        className="w-full flex items-center justify-center gap-1 px-3 py-2.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 text-sm font-medium transition active:scale-95 disabled:opacity-50"
                      >
                        {confirmingId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          setDisputingId(booking.id);
                          setDisputeReason('');
                        }}
                        className="w-full flex items-center justify-center gap-1 px-3 py-2.5 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm font-medium transition active:scale-95"
                      >
                        <ThumbsDown className="h-4 w-4" /> Dispute
                      </button>
                    </>
                  )}

                  {booking.status === 'completed' && (
                    <Link href={`/provider/${booking.provider_id}?review=true&bookingId=${booking.id}`}
                      className="w-full flex items-center justify-center gap-1 px-3 py-2.5 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 text-sm font-medium transition active:scale-95">
                      <Star className="h-4 w-4" /> Review
                    </Link>
                  )}

                  {booking.receipt_token && (
                    <button
                      onClick={() => shareReceipt(booking.receipt_token!)}
                      className="w-full flex items-center justify-center gap-1 px-3 py-2.5 bg-green-50 text-green-700 rounded-full hover:bg-green-100 text-sm font-medium transition active:scale-95"
                    >
                      <Share2 className="h-4 w-4" /> Receipt
                    </button>
                  )}

                  <button
                    onClick={() => setFlagBookingId(booking.id)}
                    className="w-full flex items-center justify-center gap-1 px-3 py-2.5 bg-red-50 text-red-700 rounded-full hover:bg-red-100 text-sm font-medium transition active:scale-95"
                  >
                    <Flag className="h-4 w-4" /> Report Issue
                  </button>
                </div>
              </div>

              {disputingId === booking.id && (
                <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-2">Why are you disputing?</h4>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Provider did not show up, poor work quality..."
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleDispute(booking.id)}
                      disabled={disputingId === booking.id}
                      className="px-4 py-2 bg-orange-600 text-white rounded-full text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
                    >
                      Submit Dispute
                    </button>
                    <button
                      onClick={() => setDisputingId(null)}
                      className="px-4 py-2 border border-gray-300 rounded-full text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                    <div
                      key={booking.id}
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
                          {booking.provider_avatar ? (
                            <img src={booking.provider_avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-semibold text-lg">{booking.provider_name?.[0] || '?'}</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link href={`/provider/${booking.provider_id}`} className="font-semibold text-gray-900 hover:text-primary-600 truncate block">
                              {booking.provider_business || booking.provider_name || 'Unknown Provider'}
                            </Link>
                            <p className="text-xs text-gray-500 truncate">{booking.service_name}</p>
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
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:w-40 flex-shrink-0">
                          {booking.status === 'completed' && (
                            <Link href={`/provider/${booking.provider_id}?review=true&bookingId=${booking.id}`}
                              className="w-full flex items-center justify-center gap-1 px-3 py-2.5 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 text-sm font-medium transition active:scale-95">
                              <Star className="h-4 w-4" /> Review
                            </Link>
                          )}

                          {booking.receipt_token && (
                            <button
                              onClick={() => shareReceipt(booking.receipt_token!)}
                              className="w-full flex items-center justify-center gap-1 px-3 py-2.5 bg-green-50 text-green-700 rounded-full hover:bg-green-100 text-sm font-medium transition active:scale-95"
                            >
                              <Share2 className="h-4 w-4" /> Receipt
                            </button>
                          )}

                          <button
                            onClick={() => setFlagBookingId(booking.id)}
                            className="w-full flex items-center justify-center gap-1 px-3 py-2.5 bg-red-50 text-red-700 rounded-full hover:bg-red-100 text-sm font-medium transition active:scale-95"
                          >
                            <Flag className="h-4 w-4" /> Report Issue
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {flagBookingId && (
        <FlagBookingModal
          isOpen={true}
          onClose={() => setFlagBookingId(null)}
          bookingId={flagBookingId}
        />
      )}
    </div>
  );
}