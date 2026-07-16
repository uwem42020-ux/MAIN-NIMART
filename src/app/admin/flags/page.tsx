// src/app/admin/flags/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/supabase-any';
import { format } from 'date-fns';
import { Flag, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { NimartSpinner } from '@/components/common/NimartSpinner';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-red-100 text-red-800',
};

export default function AdminFlags() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: flags, isLoading } = useQuery({
    queryKey: ['admin-flags', filterStatus],
    queryFn: async () => {
      let query = db
        .from('booking_flags')
        .select(`
          *,
          booking:booking_id (
            booking_number,
            service_name,
            customer_id,
            provider_id,
            status,
            customer_profile:customer_id (full_name, phone),
            provider_profile:provider_id (full_name, phone)
          ),
          flagged_by_profile:flagged_by (full_name)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateFlagStatus = async (flagId: number, status: string) => {
    const { error } = await db
      .from('booking_flags')
      .update({ status, resolved_at: new Date().toISOString() })
      .eq('id', flagId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Flag ${status}`);
      queryClient.invalidateQueries({ queryKey: ['admin-flags'] });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Booking Flags</h1>

      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'reviewing', 'resolved', 'dismissed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition',
              filterStatus === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><NimartSpinner size="lg" /></div>
      ) : !flags?.length ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <Flag className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-gray-500">No flags found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {flags.map((flag: any) => (
            <div key={flag.id} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', STATUS_COLORS[flag.status])}>
                      {flag.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(flag.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {flag.flag_type.replace(/_/g, ' ')}
                  </p>
                  {flag.description && (
                    <p className="mt-1 text-sm text-gray-600">{flag.description}</p>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    <span>Reported by: {flag.flagged_by_profile?.full_name || 'Unknown'}</span>
                    {flag.booking && (
                      <span className="ml-4">
                        Booking: {flag.booking.booking_number} — {flag.booking.service_name}
                      </span>
                    )}
                  </div>
                  {flag.booking && (
                    <div className="mt-1 text-sm text-gray-500">
                      <span>Customer: {flag.booking.customer_profile?.full_name || 'N/A'} ({flag.booking.customer_profile?.phone || ''})</span>
                      <span className="ml-4">Provider: {flag.booking.provider_profile?.full_name || 'N/A'} ({flag.booking.provider_profile?.phone || ''})</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {flag.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateFlagStatus(flag.id, 'reviewing')}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                      >
                        <Eye className="h-4 w-4" /> Review
                      </button>
                    </>
                  )}
                  {flag.status === 'reviewing' && (
                    <>
                      <button
                        onClick={() => updateFlagStatus(flag.id, 'resolved')}
                        className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                      >
                        <CheckCircle className="h-4 w-4" /> Resolve
                      </button>
                      <button
                        onClick={() => updateFlagStatus(flag.id, 'dismissed')}
                        className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                      >
                        <XCircle className="h-4 w-4" /> Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}