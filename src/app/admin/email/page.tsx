// src/app/admin/email/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Send, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { NimartSpinner } from '@/components/common/NimartSpinner';

const db = supabase as any;

export default function AdminBulkEmail() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [recipientType, setRecipientType] = useState<'all' | 'customers' | 'providers'>('all');
  const [loading, setLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  async function previewRecipients() {
    setLoading(true);
    let query = db.from('profiles').select('id', { count: 'exact', head: true });

    if (recipientType === 'customers') {
      query = query.eq('role', 'customer');
    } else if (recipientType === 'providers') {
      query = query.eq('role', 'provider');
    }

    const { count, error } = await query;
    if (!error) {
      setPreviewCount(count || 0);
    }
    setLoading(false);
  }

  async function sendBulkEmail() {
    if (!subject.trim() || !content.trim()) {
      toast.error('Subject and content are required');
      return;
    }

    if (!confirm(`Send this email to all ${recipientType} users?`)) return;

    setLoading(true);
    try {
      // Step 1 – Get profile IDs of the chosen role
      let profileQuery = db.from('profiles').select('id');
      if (recipientType === 'customers') {
        profileQuery = profileQuery.eq('role', 'customer');
      } else if (recipientType === 'providers') {
        profileQuery = profileQuery.eq('role', 'provider');
      }

      const { data: profiles, error: profileError } = await profileQuery;
      if (profileError) throw profileError;
      if (!profiles || profiles.length === 0) {
        toast.error('No recipients found');
        return;
      }

      const userIds = profiles.map((p: any) => p.id);

      // Step 2 – Fetch emails via the secure RPC
      const { data: emailsData, error: rpcError } = await supabase
        .rpc('get_user_emails', { user_ids: userIds });

      if (rpcError) throw rpcError;

      const emails = emailsData?.map((e: { email: string }) => e.email).filter(Boolean) || [];

      if (emails.length === 0) {
        toast.error('No email addresses found');
        return;
      }

      // Step 3 – Send via the Edge Function
      const { error: sendError } = await supabase.functions.invoke('send-email', {
        body: { emails, subject, content, admin_id: user!.id },
      });

      if (sendError) throw sendError;

      // Log the bulk email
      await db.from('bulk_email_logs').insert({
        admin_id: user!.id,
        subject,
        content,
        recipient_count: emails.length,
      });

      toast.success(`Email sent to ${emails.length} recipients`);
      setSubject('');
      setContent('');
      setPreviewCount(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send emails');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Bulk Email</h1>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
          <div className="flex gap-4">
            <select
              value={recipientType}
              onChange={(e) => {
                setRecipientType(e.target.value as any);
                setPreviewCount(null);
              }}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Users</option>
              <option value="customers">Customers Only</option>
              <option value="providers">Providers Only</option>
            </select>
            <button
              type="button"
              onClick={previewRecipients}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Users className="h-4 w-4" />
              Preview Count
            </button>
          </div>
          {previewCount !== null && (
            <p className="mt-2 text-sm text-gray-600">
              {previewCount} {recipientType} user(s) will receive this email.
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Email subject..."
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
            placeholder="<h2>Hello!</h2><p>Your message here...</p>"
          />
          <p className="mt-1 text-xs text-gray-500">You can use HTML formatting.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <NimartSpinner size="md" />
          </div>
        ) : (
          <button
            onClick={sendBulkEmail}
            disabled={loading || !subject.trim() || !content.trim()}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="h-5 w-5" />
            Send Bulk Email
          </button>
        )}
      </div>
    </div>
  );
}