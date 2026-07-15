// src/app/admin/verifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Eye, ChevronDown, ChevronRight, FileText, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { NimartSpinner } from '@/components/common/NimartSpinner';

interface VerificationDocument {
  id: string;
  provider_id: string;
  document_type: string;
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
}

interface ProviderGroup {
  provider_id: string;
  business_name: string | null;
  full_name: string | null;
  email: string | null;
  is_verified: boolean;
  documents: VerificationDocument[];
}

const documentTypeLabels: Record<string, string> = {
  id_card: 'Government ID',
  business_certificate: 'Business Certificate',
  utility_bill: 'Utility Bill',
  other: 'Other Document',
};

export default function AdminVerifications() {
  const [providerGroups, setProviderGroups] = useState<ProviderGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());
  const [selectedDoc, setSelectedDoc] = useState<VerificationDocument | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [filter]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('verification-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'verification_documents' },
        () => {
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  async function fetchDocuments() {
    setLoading(true);

    let query = supabase
      .from('verification_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data: docs, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
      setProviderGroups([]);
      setLoading(false);
      return;
    }

    if (!docs || docs.length === 0) {
      setProviderGroups([]);
      setLoading(false);
      return;
    }

    // Get unique provider IDs
    const providerIds = [...new Set(docs.map((d: any) => d.provider_id))];

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, is_verified')
      .in('id', providerIds);

    // Fetch providers
    const { data: providers } = await supabase
      .from('providers')
      .select('id, business_name')
      .in('id', providerIds);

    // Create lookup maps
    const profileMap = new Map();
    profiles?.forEach((p: any) => profileMap.set(p.id, p));

    const providerMap = new Map();
    providers?.forEach((p: any) => providerMap.set(p.id, p));

    // Group documents by provider
    const groupsMap = new Map<string, ProviderGroup>();
    
    docs.forEach((doc: any) => {
      const providerId = doc.provider_id;
      
      if (!groupsMap.has(providerId)) {
        const profile = profileMap.get(providerId) || {};
        const provider = providerMap.get(providerId) || {};
        
        groupsMap.set(providerId, {
          provider_id: providerId,
          business_name: provider.business_name || null,
          full_name: profile.full_name || null,
          email: profile.email || null,
          is_verified: profile.is_verified || false,
          documents: []
        });
      }
      
      groupsMap.get(providerId)!.documents.push(doc);
    });

    // Convert map to array
    const groups = Array.from(groupsMap.values());
    setProviderGroups(groups);
    
    // Auto-expand the first provider
    if (groups.length > 0 && expandedProviders.size === 0) {
      setExpandedProviders(new Set([groups[0].provider_id]));
    }
    
    setLoading(false);
  }

  const toggleProvider = (providerId: string) => {
    setExpandedProviders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(providerId)) {
        newSet.delete(providerId);
      } else {
        newSet.add(providerId);
      }
      return newSet;
    });
  };

  async function handleDocumentStatus(status: 'approved' | 'rejected') {
    if (!selectedDoc) return;
    
    setSubmitting(true);
    console.log('Updating document:', selectedDoc.id, 'to status:', status);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const updateData = {
        status: status,
        admin_notes: adminNotes || null,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      };

      console.log('Update payload:', updateData);

      const { data, error } = await supabase
        .from('verification_documents')
        .update(updateData)
        .eq('id', selectedDoc.id)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Update successful, returned:', data);
      toast.success(`Document ${status}`);
      
      // Refresh the list
      await fetchDocuments();
      
      // Close modal and reset
      setShowModal(false);
      setSelectedDoc(null);
      setAdminNotes('');
    } catch (error: any) {
      console.error('Full error object:', error);
      toast.error(error.message || 'Failed to update document');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleProviderVerification(providerId: string, currentStatus: boolean) {
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: newStatus })
        .eq('id', providerId);

      if (error) throw error;

      toast.success(newStatus ? 'Provider verified' : 'Provider verification removed');
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const totalPendingDocs = providerGroups.flatMap(g => g.documents).filter(d => d.status === 'pending').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Verification Requests</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 font-medium capitalize',
              filter === f
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {f}
            {f === 'pending' && totalPendingDocs > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {totalPendingDocs}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <NimartSpinner size="md" />
        </div>
      ) : providerGroups.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No verification requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {providerGroups.map((group) => {
            const isExpanded = expandedProviders.has(group.provider_id);
            const pendingCount = group.documents.filter(d => d.status === 'pending').length;
            const displayName = group.business_name || group.full_name || 'Unknown Provider';
            
            return (
              <div key={group.provider_id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* Provider Header */}
                <button
                  onClick={() => toggleProvider(group.provider_id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{displayName}</p>
                        {group.is_verified && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{group.email || 'No email'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pendingCount > 0 && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        {pendingCount} pending
                      </span>
                    )}
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>
                </button>

                {/* Documents List */}
                {isExpanded && (
                  <div className="border-t bg-gray-50/50">
                    {group.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 pl-12 hover:bg-gray-50 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-2 h-2 rounded-full',
                            doc.status === 'approved' ? 'bg-green-500' :
                            doc.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                          )} />
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {documentTypeLabels[doc.document_type]}
                            </p>
                            <p className="text-xs text-gray-500">
                              Uploaded {format(new Date(doc.created_at), 'MMM d, yyyy')}
                            </p>
                            {doc.admin_notes && (
                              <p className="text-xs text-gray-500 mt-1 italic">Note: {doc.admin_notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={doc.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded"
                            title="View Document"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                          {doc.status === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedDoc(doc);
                                setAdminNotes('');
                                setShowModal(true);
                              }}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="Approve/Reject"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Manual Verification Toggle */}
                    <div className="p-3 pl-12 border-t bg-white">
                      <button
                        onClick={() => toggleProviderVerification(group.provider_id, group.is_verified)}
                        className={cn(
                          'text-sm font-medium flex items-center gap-2 px-3 py-1.5 rounded-lg transition',
                          group.is_verified
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                      >
                        <Shield className="h-4 w-4" />
                        {group.is_verified ? 'Remove Verification' : 'Verify Provider'}
                      </button>
                      <p className="text-xs text-gray-500 mt-1">
                        {group.is_verified 
                          ? 'Provider is verified and badge appears on profile.' 
                          : 'Manually verify this provider after reviewing documents.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Review Document</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-gray-100 rounded-lg p-3">
                <a
                  href={selectedDoc.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Document
                </a>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Admin Notes (optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Document is clear and valid"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleDocumentStatus('rejected')}
                  disabled={submitting}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleDocumentStatus('approved')}
                  disabled={submitting}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}