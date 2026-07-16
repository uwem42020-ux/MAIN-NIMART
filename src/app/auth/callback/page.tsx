// src/app/auth/callback/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { User, Briefcase, CheckCircle } from 'lucide-react';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import { REFERRAL_BONUS } from '@/lib/nicoinConfig';
import { requestPushPermission } from '@/lib/pushNotifications';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [needsRole, setNeedsRole] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    let mounted = true;

    const refParam = searchParams.get('ref');
    if (refParam) {
      setReferralCode(refParam.trim().toUpperCase());
    }

    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session) throw new Error('No session established');

        const currentUser = session.user;
        if (!mounted) return;
        setUser(currentUser);

        const { data: profile, error: profileError } = await db
          .from('profiles')
          .select('role, full_name, is_complete')
          .eq('id', currentUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if ((profile as any)?.role) {
          await refreshProfile();
          const p = profile as any;
          if (p.role === 'provider' && !p.is_complete) {
            router.push('/provider/setup');
          } else {
            router.push(p.role === 'provider' ? '/provider/dashboard' : '/customer/dashboard');
          }
          return;
        }

        setFullName((profile as any)?.full_name || currentUser.user_metadata?.full_name || '');
        setNeedsRole(true);
      } catch (err: any) {
        console.error('Auth callback error:', err);
        toast.error('Authentication failed. Please try again.');
        router.push('/auth/signin');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [router, refreshProfile, searchParams]);

  async function completeProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const { data: existingProfile, error: existingError } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      toast.error('Failed to check existing profile. Please try again.');
      return;
    }

    if ((existingProfile as any)?.role) {
      toast.error(`This account is already registered as a ${(existingProfile as any).role}. Please sign in.`);
      await supabase.auth.signOut();
      router.push('/auth/signin');
      return;
    }

    setSubmitting(true);
    try {
      if (role === 'customer') {
        const { error: profileError } = await db
          .from('profiles')
          .update({ full_name: fullName, role, is_complete: true })
          .eq('id', user.id);

        if (profileError) throw profileError;
        await refreshProfile();
        await requestPushPermission(user.id);
        toast.success('Welcome to Nimart!');
        router.push('/customer/dashboard');
      } else {
        if (referralCode.trim()) {
          const { data: referrer } = await db
            .from('providers')
            .select('id')
            .eq('referral_code', referralCode.trim().toUpperCase())
            .single();

          if (referrer && referrer.id !== user.id) {
            await db
              .from('providers')
              .update({ referred_by: referrer.id })
              .eq('id', user.id);

            await db.from('referrals').insert({
              referrer_id: referrer.id,
              referred_provider_id: user.id,
            });
          }
        }

        const { error: profileError } = await db
          .from('profiles')
          .update({ full_name: fullName, role, is_complete: false })
          .eq('id', user.id);

        if (profileError) throw profileError;
        await refreshProfile();
        await requestPushPermission(user.id);
        toast.success('Account created! Please complete your business profile.');
        router.push('/provider/setup');
      }
    } catch (error: any) {
      console.error('Profile completion error:', error);
      toast.error(error.message || 'Failed to complete profile');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NimartSpinner size="lg" />
      </div>
    );
  }

  if (needsRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="flex justify-center mb-2">
            <img
              src="https://qootzfndochmcoijnwxf.supabase.co/storage/v1/object/public/logo/logo.png"
              alt="Nimart"
              className="h-10 w-auto"
            />
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">Welcome to Nimart!</h2>
          <p className="text-gray-600 text-center mb-6">Just one more step to get started.</p>
          <form onSubmit={completeProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">I want to...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`p-4 border-2 rounded-xl flex flex-col items-center transition-all ${
                    role === 'customer' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  <User className="h-6 w-6 mb-1" />
                  <span className="font-medium">Hire Services</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('provider')}
                  className={`p-4 border-2 rounded-xl flex flex-col items-center transition-all ${
                    role === 'provider' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  <Briefcase className="h-6 w-6 mb-1" />
                  <span className="font-medium">Offer Services</span>
                </button>
              </div>
            </div>

            {referralCode && role === 'provider' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                🎁 Referral code <strong>{referralCode}</strong> applied – you'll both earn {REFERRAL_BONUS} Nicoin after your first completed booking.
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 transition"
            >
              <CheckCircle className="h-5 w-5" />
              {submitting ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <NimartSpinner size="lg" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}