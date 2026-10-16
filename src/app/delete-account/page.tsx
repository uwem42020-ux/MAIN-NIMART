// src/app/delete-account/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { requestAccountDeletion } from '@/lib/accountDeletion';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  AlertTriangle,
  XCircle,
  Info,
  Trash2,
} from 'lucide-react';

const WHAT_GETS_DELETED = [
  'Your profile, photo, and personal details',
  'Your bookings and booking history',
  'Your messages and chat threads',
  'Your reviews and ratings',
  'Your saved location and preferences',
];

const WHAT_STAYS = [
  'Anonymous records needed for legal or safety reasons',
  'Aggregated stats that cannot identify you',
];

export default function DeleteAccountPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!user) {
      toast.error('Please sign in and try again.');
      return;
    }

    setSubmitting(true);
    try {
      const ok = await requestAccountDeletion(user.id, reason);
      if (!ok) {
        throw new Error('Could not submit request. Please try again.');
      }

      toast.success('Deletion requested. Signing you out...');
      setTimeout(async () => {
        await signOut();
        router.push('/');
      }, 1500);
    } catch (err: any) {
      toast.error(err?.message ?? 'Try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            Delete account
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Warning */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            This cannot be undone.
          </h2>
          <p className="text-gray-600 max-w-md">
            Deleting your Nimart account is permanent. Once processed, you
            will lose access to your account and all associated data.
          </p>
        </div>

        {/* What gets deleted */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            What will be deleted
          </h3>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {WHAT_GETS_DELETED.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 px-4 py-3 ${
                  idx < WHAT_GETS_DELETED.length - 1
                    ? 'border-b border-gray-100'
                    : ''
                }`}
              >
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-800">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What stays */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            What may be retained
          </h3>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {WHAT_STAYS.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 px-4 py-3 ${
                  idx < WHAT_STAYS.length - 1
                    ? 'border-b border-gray-100'
                    : ''
                }`}
              >
                <Info className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Why are you leaving? (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Help us improve — tell us why you're deleting your account."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
          />
        </div>

        {/* Confirm */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Confirm
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Type <span className="font-mono font-bold text-gray-900">DELETE</span>{' '}
            in the box below to enable the button.
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            autoCapitalize="characters"
            autoCorrect="off"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 text-center text-lg font-bold tracking-wider"
          />
        </div>

        {/* Buttons */}
        <button
          onClick={handleDelete}
          disabled={!canSubmit || submitting}
          className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-4 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <Trash2 className="h-5 w-5" />
          {submitting ? 'Submitting...' : 'Permanently delete'}
        </button>

        <Link
          href="/"
          className="block text-center text-primary-600 font-semibold py-4 mt-2 hover:underline"
        >
          Keep my account
        </Link>
      </div>
    </div>
  );
}