// src/app/admin/referrals/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/supabase-any';
import { format } from 'date-fns';
import { Users, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import { REFERRAL_BONUS } from '@/lib/nicoinConfig';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  awarded: 'bg-green-100 text-green-800',
};

export default function AdminReferrals() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: referrals, isLoading } = useQuery({
    queryKey: ['admin-referrals', filterStatus],
    queryFn: async () => {
      let query = db
        .from('referrals')
        .select(`
          id,
          referrer_id,
          referred_provider_id,
          status,
          created_at,
          awarded_at,
          referrer:referrer_id ( business_name ),
          referred:referred_provider_id ( business_name ),
          referrer_profile:referrer_id ( full_name ),
          referred_profile:referred_provider_id ( full_name )
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const counts = {
    total: referrals?.length || 0,
    pending: referrals?.filter((r: any) => r.status === 'pending').length || 0,
    awarded: referrals?.filter((r: any) => r.status === 'awarded').length || 0,
  };

  const handleAward = async (referralId: string, referrerId: string, referredProviderId: string) => {
    try {
      await db.rpc('adjust_coin_balance', { p_provider_id: referrerId, p_amount: REFERRAL_BONUS });
      await db.rpc('adjust_coin_balance', { p_provider_id: referredProviderId, p_amount: REFERRAL_BONUS });
      await db.from('referrals').update({ status: 'awarded', awarded_at: new Date().toISOString() }).eq('id', referralId);
      toast.success(`Referral awarded (+${REFERRAL_BONUS} Nicoin each)`);
      queryClient.invalidateQueries({ queryKey: ['admin-referrals'] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancel = async (referralId: string) => {
    if (!confirm('Cancel this referral? This cannot be undone.')) return;
    const { error } = await db.from('referrals').delete().eq('id', referralId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Referral cancelled');
    queryClient.invalidateQueries({ queryKey: ['admin-referrals'] });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Referral Monitor</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <Users className="h-6 w-6 text-primary-600 mb-2" />
          <p className="text-2xl font-bold">{counts.total}</p>
          <p className="text-sm text-gray-500">Total Referrals</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <Clock className="h-6 w-6 text-yellow-600 mb-2" />
          <p className="text-2xl font-bold">{counts.pending}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <CheckCircle className="h-6 w-6 text-green-600 mb-2" />
          <p className="text-2xl font-bold">{counts.awarded}</p>
          <p className="text-sm text-gray-500">Awarded</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'awarded'].map(status => (
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
      ) : !referrals?.length ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-gray-500">No referrals found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map((ref: any) => {
            const referrerName = ref.referrer?.business_name || ref.referrer_profile?.full_name || 'Unknown';
            const referredName = ref.referred?.business_name || ref.referred_profile?.full_name || 'Unknown';

            return (
              <div key={ref.id} className="bg-white rounded-xl shadow-sm border p-5 flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', STATUS_COLORS[ref.status])}>
                      {ref.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(ref.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {referrerName} → {referredName}
                  </p>
                  {ref.awarded_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Awarded: {format(new Date(ref.awarded_at), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>

                {ref.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAward(ref.id, ref.referrer_id, ref.referred_provider_id)}
                      className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" /> Award
                    </button>
                    <button
                      onClick={() => handleCancel(ref.id)}
                      className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                    >
                      <XCircle className="h-4 w-4" /> Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}