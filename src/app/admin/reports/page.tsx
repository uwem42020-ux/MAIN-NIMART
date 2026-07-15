// src/app/admin/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { NimartSpinner } from '@/components/common/NimartSpinner';

interface Report {
  id: string;
  reporter_id: string;
  provider_id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter: { full_name: string };
  provider: { business_name: string };
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('pending');

  useEffect(() => {
    fetchReports();
  }, [filter]);

  async function fetchReports() {
    setLoading(true);
    let query = supabase
      .from('reports')
      .select(`
        *,
        reporter:reporter_id(full_name),
        provider:provider_id(business_name)
      `)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setReports(data || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('reports').update({ status }).eq('id', id);
    if (error) toast.error('Failed to update');
    else {
      toast.success('Status updated');
      fetchReports();
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <NimartSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">User Reports</h1>

      <div className="flex gap-2 mb-6 border-b">
        {['pending', 'reviewed', 'resolved', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={cn(
              'px-4 py-2 font-medium capitalize',
              filter === f ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {reports.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No reports found.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">
                    {report.reporter?.full_name} reported {report.provider?.business_name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{report.reason}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {format(new Date(report.created_at), 'PPP p')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={report.status}
                    onChange={(e) => updateStatus(report.id, e.target.value)}
                    className="text-sm border rounded-lg px-2 py-1"
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                  <a
                    href={`/provider/${report.provider_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                  >
                    <Eye className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}