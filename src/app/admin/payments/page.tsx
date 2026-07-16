// src/app/admin/payments/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminPayments() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  async function fetchSubmissions() {
    setLoading(true);

    let query = db
      .from('payment_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') query = query.eq('status', filter);
    const { data: submissionsData, error } = await query;

    if (error || !submissionsData || submissionsData.length === 0) {
      setSubmissions(submissionsData || []);
      setLoading(false);
      return;
    }

    const providerIds = [...new Set(submissionsData.map((s: any) => s.provider_id))];

    const { data: profiles } = await db
      .from('profiles')
      .select('id, full_name, email')
      .in('id', providerIds);

    const { data: providers } = await db
      .from('providers')
      .select('id, business_name')
      .in('id', providerIds);

    const profileMap = new Map<string, { name: string; email: string }>();
    profiles?.forEach((p: any) => {
      profileMap.set(p.id, { name: p.full_name || '', email: p.email || '' });
    });

    const businessMap = new Map<string, string>();
    providers?.forEach((p: any) => {
      businessMap.set(p.id, p.business_name || '');
    });

    const enriched = submissionsData.map((sub: any) => {
      const prof = profileMap.get(sub.provider_id);
      const bizName = businessMap.get(sub.provider_id);
      return {
        ...sub,
        provider_name: bizName || prof?.name || 'Unnamed',
        provider_email: prof?.email || 'No email',
      };
    });

    setSubmissions(enriched);
    setLoading(false);
  }

  async function handleAction(submissionId: number, status: 'approved' | 'rejected') {
    try {
      const submission = submissions.find(s => s.id === submissionId);
      if (!submission) return;

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await db
        .from('payment_submissions')
        .update({ status, admin_id: user!.id, updated_at: new Date().toISOString() })
        .eq('id', submissionId);

      if (error) throw error;

      if (status === 'approved') {
        const amountNicoin = submission.amount_naira;
        await db.rpc('adjust_coin_balance', {
          p_provider_id: submission.provider_id,
          p_amount: amountNicoin,
        });

        await db.from('coin_transactions').insert({
          provider_id: submission.provider_id,
          amount: amountNicoin,
          type: 'admin_credit',
          admin_id: user!.id,
          reference_id: submission.id.toString(),
        });
      }

      toast.success(`Payment ${status}`);
      fetchSubmissions();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Payment Submissions</h1>

      <div className="flex gap-2 mb-6 border-b">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 font-medium capitalize ${
              filter === f ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center py-8 text-gray-500">Loading...</p>
      ) : submissions.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No submissions.</p>
      ) : (
        <div className="space-y-4">
          {submissions.map(sub => (
            <div key={sub.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{sub.provider_name}</p>
                  <p className="text-sm text-gray-500">{sub.provider_email}</p>
                  <p className="text-sm font-semibold text-primary-600 mt-1">
                    ₦{sub.amount_naira.toLocaleString()} → {sub.amount_naira} Nicoin
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Submitted {format(new Date(sub.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                  {sub.proof_url && (
                    <a
                      href={sub.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      <Eye className="h-3 w-3" /> View Receipt
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {sub.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAction(sub.id, 'approved')}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-green-700 flex items-center gap-1"
                      >
                        <CheckCircle className="h-4 w-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(sub.id, 'rejected')}
                        className="bg-red-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-red-700 flex items-center gap-1"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </>
                  )}
                  {sub.status !== 'pending' && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      sub.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {sub.status}
                    </span>
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