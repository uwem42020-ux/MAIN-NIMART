// src/components/FlagBookingModal.tsx
'use client';

import { useState } from 'react';
import { db } from '@/lib/supabase-any';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { X, Flag, Loader2 } from 'lucide-react';

interface FlagBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
}

const FLAG_TYPES = [
  { value: 'provider_no_show', label: 'Provider did not show up' },
  { value: 'poor_quality', label: 'Poor quality of work' },
  { value: 'extra_payment_demanded', label: 'Provider demanded extra payment' },
  { value: 'unprofessional', label: 'Provider was unprofessional/rude' },
  { value: 'safety_concern', label: 'Safety concern' },
  { value: 'provider_demanded_upfront', label: 'Provider demanded upfront payment' },
  { value: 'customer_did_not_pay', label: 'Customer did not pay (provider only)' },
  { value: 'other', label: 'Other' },
];

export function FlagBookingModal({ isOpen, onClose, bookingId }: FlagBookingModalProps) {
  const { user } = useAuth();
  const [flagType, setFlagType] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in');
      return;
    }
    if (!flagType) {
      toast.error('Select a reason');
      return;
    }

    setLoading(true);
    const { error } = await db.from('booking_flags').insert({
      booking_id: bookingId,
      flagged_by: user.id,
      flag_type: flagType,
      description: description.trim() || null,
    } as any);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Report submitted. Our team will review it.');
      setFlagType('');
      setDescription('');
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Report Issue</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <select
              value={flagType}
              onChange={(e) => setFlagType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            >
              <option value="">Select a reason</option>
              {FLAG_TYPES.map((ft) => (
                <option key={ft.value} value={ft.value}>
                  {ft.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description (optional)</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Provide any additional details..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Flag className="h-5 w-5" />}
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}