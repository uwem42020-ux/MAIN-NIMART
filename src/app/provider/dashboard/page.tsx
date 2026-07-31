// src/app/provider/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { ProviderStatusToggle } from '@/components/provider/ProviderStatusToggle';
import {
  Calendar, Star, Settings, Image, Package, Shield, Coins,
  TrendingUp, Zap, Tag, Users, Copy, Share2,
  MessageCircle, Eye, UserCheck,
} from 'lucide-react';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import toast from 'react-hot-toast';
import { CATEGORIES } from '@/data/categories';
import {
  STANDARD_BOOST_COST,
  PREMIUM_BOOST_COST,
  TOP_PLACEMENT_COST,
  EXTRA_CATEGORY_COST,
  REFERRAL_BONUS,
} from '@/lib/nicoinConfig';
import { generateUniqueReferralCode } from '@/lib/referralUtils';

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  averageRating: number;
  reviewCount: number;
}

interface ReferralStats {
  total: number;
  pending: number;
  awarded: number;
}

export default function ProviderDashboard() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [providerData, setProviderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    averageRating: 0,
    reviewCount: 0,
  });
  const [isVerified, setIsVerified] = useState(false);
  const [hasPendingVerification, setHasPendingVerification] = useState(false);

  const [coinBalance, setCoinBalance] = useState(0);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [showTopPlacementModal, setShowTopPlacementModal] = useState(false);
  const [showExtraCategoryModal, setShowExtraCategoryModal] = useState(false);
  const [boostLoading, setBoostLoading] = useState(false);
  const [boostType, setBoostType] = useState<'standard' | 'premium'>('standard');
  const [extraCategorySlug, setExtraCategorySlug] = useState('');

  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    total: 0,
    pending: 0,
    awarded: 0,
  });

  useEffect(() => {
    if (!user) return;
    fetchAllData();
  }, [user]);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [providerRes, bookingsRes, reviewsRes, verificationRes, referralsRes] = await Promise.all([
        db.from('providers').select('*').eq('id', user!.id).single(),
        db.from('bookings').select('*').eq('provider_id', user!.id),
        db.from('reviews').select('rating').eq('provider_id', user!.id),
        db.from('verification_documents').select('status').eq('provider_id', user!.id).eq('status', 'pending').limit(1),
        db.from('referrals').select('*', { count: 'exact', head: false }).eq('referrer_id', user!.id),
      ]);

      const provider = providerRes.data as any;
      const bookings = (bookingsRes.data || []) as any[];
      const reviews = (reviewsRes.data || []) as any[];
      const pendingVerification = (verificationRes.data || []) as any[];

      // Fetch profile
      const { data: profileData } = await db.from('profiles').select('*').eq('id', user!.id).single();

      setProviderData({ ...provider, profile: profileData });
      setIsVerified((profileData as any)?.is_verified || false);
      setHasPendingVerification(pendingVerification.length > 0);
      setCoinBalance(provider?.coin_balance || 0);

      // Stats
      setStats({
        totalBookings: bookings.length,
        pendingBookings: bookings.filter((b: any) => b.status === 'pending').length,
        completedBookings: bookings.filter((b: any) => b.status === 'completed').length,
        averageRating: reviews.length
          ? reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length
          : 0,
        reviewCount: reviews.length,
      });

      // Referral code
      if (provider && !provider.referral_code) {
        const name = provider.business_name || (profileData as any)?.full_name || 'Provider';
        const code = await generateUniqueReferralCode(name);
        await db.from('providers').update({ referral_code: code }).eq('id', user!.id);
        setReferralCode(code);
      } else if (provider?.referral_code) {
        setReferralCode(provider.referral_code);
      }

      // Referral stats
      const refs = (referralsRes.data || []) as any[];
      setReferralStats({
        total: refs.length,
        pending: refs.filter((r: any) => r.status === 'pending').length,
        awarded: refs.filter((r: any) => r.status === 'awarded').length,
      });

      // Redirect if profile incomplete
      if (provider && profileData && (!(profileData as any)?.lga_id || !provider.business_name)) {
        router.push('/provider/setup');
      }
    } finally {
      setLoading(false);
    }
  }

  const handleBoost = async () => {
    setBoostLoading(true);
    try {
      const cost = boostType === 'standard' ? STANDARD_BOOST_COST : PREMIUM_BOOST_COST;
      const { data: provider } = await db
        .from('providers')
        .select('coin_balance, status')
        .eq('id', user!.id)
        .single();
      if (!provider || (provider as any).coin_balance < cost) {
        toast.error('Insufficient Nicoin');
        return;
      }
      if ((provider as any).status === 'away') {
        toast.error('Set your status to Available or Busy to boost');
        return;
      }
      const duration = boostType === 'standard' ? 7 : 30;
      const newBoost = new Date();
      newBoost.setDate(newBoost.getDate() + duration);
      await db.rpc('purchase_boost', {
        p_provider_id: user!.id,
        p_cost: cost,
        p_boost_until: newBoost.toISOString(),
      });
      setCoinBalance(prev => prev - cost);
      toast.success(`Profile boosted for ${duration} days!`);
      setShowBoostModal(false);
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBoostLoading(false);
    }
  };

  const handleTopPlacement = async () => {
    setBoostLoading(true);
    try {
      const cost = TOP_PLACEMENT_COST;
      const { data: provider } = await db
        .from('providers')
        .select('coin_balance, status')
        .eq('id', user!.id)
        .single();
      if (!provider || (provider as any).coin_balance < cost) {
        toast.error('Insufficient Nicoin');
        return;
      }
      if ((provider as any).status === 'away') {
        toast.error('Set your status to Available or Busy to use Top Placement');
        return;
      }
      const newTop = new Date();
      newTop.setDate(newTop.getDate() + 7);
      await db.rpc('purchase_top_placement', {
        p_provider_id: user!.id,
        p_cost: cost,
        p_top_until: newTop.toISOString(),
      });
      setCoinBalance(prev => prev - cost);
      toast.success('Top placement activated for 7 days!');
      setShowTopPlacementModal(false);
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBoostLoading(false);
    }
  };

  const handleExtraCategory = async () => {
    if (!extraCategorySlug) return;
    setBoostLoading(true);
    try {
      const cost = EXTRA_CATEGORY_COST;
      await db.rpc('purchase_extra_category', {
        p_provider_id: user!.id,
        p_category_slug: extraCategorySlug,
        p_cost: cost,
      });
      setCoinBalance(prev => prev - cost);
      toast.success('Extra category added!');
      setShowExtraCategoryModal(false);
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBoostLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `https://nimart.ng/auth/signup?role=provider&ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
  };

  const shareReferralLink = () => {
    const link = `https://nimart.ng/auth/signup?role=provider&ref=${referralCode}`;
    const text = `Join Nimart as a provider and get ${REFERRAL_BONUS} free Nicoins! Use my referral link: ${link}`;
    if (navigator.share) {
      navigator.share({ title: 'Join Nimart', text, url: link });
    } else {
      navigator.clipboard.writeText(link);
      toast.success('Referral link copied!');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NimartSpinner size="lg" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded-lg w-48" />
          <div className="h-24 bg-gray-200 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, {providerData?.business_name || profile?.full_name || 'Provider'}</p>
        </div>
        {providerData && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Status:</span>
            <ProviderStatusToggle
              providerId={user.id}
              initialStatus={providerData.status}
              onStatusChange={() => fetchAllData()}
            />
          </div>
        )}
      </div>

      {/* Verification Banner */}
      {!isVerified && !hasPendingVerification && (
        <div className="bg-blue-50 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-blue-800">Get verified to build trust</p>
              <p className="text-sm text-blue-600">Verified providers get 3x more bookings</p>
            </div>
          </div>
          <Link href="/provider/verification" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 text-sm font-semibold w-full sm:w-auto text-center transition">
            Get Verified
          </Link>
        </div>
      )}

      {hasPendingVerification && (
        <div className="bg-amber-50 rounded-2xl p-4 sm:p-5 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-amber-800">Verification in progress</p>
            <p className="text-sm text-amber-600">We're reviewing your documents. This usually takes 24-48 hours.</p>
          </div>
        </div>
      )}

      {isVerified && (
        <div className="bg-green-50 rounded-2xl p-4 sm:p-5 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <img src="/verify.png" alt="Verified" className="h-7 w-7" />
          </div>
          <div>
            <p className="font-semibold text-green-800">Your account is verified!</p>
            <p className="text-sm text-green-600">The verified badge appears on your profile and builds customer trust.</p>
          </div>
        </div>
      )}

      {/* Quick Actions — Moved up */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link href="/provider/bookings" className="group bg-white rounded-2xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-center">
            <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary-100 transition">
              <Calendar className="h-5 w-5 text-primary-600" />
            </div>
            <h3 className="font-semibold text-sm text-gray-900">Bookings</h3>
            {stats.pendingBookings > 0 && (
              <span className="inline-block mt-1 text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                {stats.pendingBookings} pending
              </span>
            )}
          </Link>

          <Link href="/provider/messages" className="group bg-white rounded-2xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-center">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-100 transition">
              <MessageCircle className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-sm text-gray-900">Messages</h3>
          </Link>

          <Link href="/provider/portfolio" className="group bg-white rounded-2xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-center">
            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-100 transition">
              <Image className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-sm text-gray-900">Portfolio</h3>
          </Link>

          <Link href="/provider/services" className="group bg-white rounded-2xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-center">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-2 group-hover:bg-amber-100 transition">
              <Package className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-sm text-gray-900">Services</h3>
          </Link>

          {isVerified ? (
            <div className="group bg-white rounded-2xl p-4 text-center opacity-60 cursor-not-allowed">
              <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-2">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-sm text-gray-900">Verified</h3>
              <span className="inline-block mt-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ Done</span>
            </div>
          ) : (
            <Link href="/provider/verification" className="group bg-white rounded-2xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-center">
              <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-2 group-hover:bg-green-100 transition">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-sm text-gray-900">Get Verified</h3>
              <span className="inline-block mt-1 text-xs font-medium text-green-600">Earn trust</span>
            </Link>
          )}
        </div>
      </div>

      {/* Nicoin Balance + Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Nicoin Card */}
        <div className="lg:col-span-1 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-white/80">Nicoin Balance</p>
            <Coins className="h-5 w-5 text-white/60" />
          </div>
          <p className="text-3xl font-bold mb-1">
            <img src="/coin.svg" alt="" className="h-6 w-6 inline-block mr-1 -mt-1" />
            {coinBalance.toLocaleString()}
          </p>
          <Link href="/provider/payment" className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white font-medium transition mt-1">
            Buy more → 
          </Link>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Calendar, color: 'text-primary-600', bg: 'bg-primary-50', label: 'Total Bookings', value: stats.totalBookings },
            { icon: Eye, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Pending', value: stats.pendingBookings },
            { icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50', label: 'Completed', value: stats.completedBookings },
            { icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Rating', value: `${stats.averageRating.toFixed(1)} (${stats.reviewCount})`, small: true },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center mb-2`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <p className={`${item.small ? 'text-base' : 'text-xl'} font-bold text-gray-900`}>{item.value}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Boost Cards */}
      <h2 className="text-base font-semibold text-gray-900 mb-3">Boost Your Visibility</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Standard Boost */}
        <div className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mb-3">
            <TrendingUp className="h-5 w-5 text-primary-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Standard Boost</h3>
          <p className="text-sm text-gray-500 mb-3">7 days at top of search</p>
          <p className="text-lg font-bold text-gray-900 mb-4">
            <img src="/coin.svg" alt="" className="h-4 w-4 inline-block mr-1" />
            {STANDARD_BOOST_COST.toLocaleString()}
          </p>
          <button
            onClick={() => { setBoostType('standard'); setShowBoostModal(true); }}
            disabled={coinBalance < STANDARD_BOOST_COST}
            className="w-full bg-primary-600 text-white py-2.5 rounded-xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-sm"
          >
            {coinBalance < STANDARD_BOOST_COST ? 'Not enough coins' : 'Boost Now'}
          </button>
        </div>

        {/* Premium Boost */}
        <div className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow ring-1 ring-amber-200">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
            <Zap className="h-5 w-5 text-amber-500" />
          </div>
          <h3 className="font-semibold text-gray-900">Premium Boost</h3>
          <p className="text-sm text-gray-500 mb-3">30 days at top · Best value</p>
          <p className="text-lg font-bold text-gray-900 mb-4">
            <img src="/coin.svg" alt="" className="h-4 w-4 inline-block mr-1" />
            {PREMIUM_BOOST_COST.toLocaleString()}
          </p>
          <button
            onClick={() => { setBoostType('premium'); setShowBoostModal(true); }}
            disabled={coinBalance < PREMIUM_BOOST_COST}
            className="w-full bg-amber-500 text-white py-2.5 rounded-xl hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-sm"
          >
            {coinBalance < PREMIUM_BOOST_COST ? 'Not enough coins' : 'Boost 1 Month'}
          </button>
        </div>

        {/* Top Placement */}
        <div className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
            <Tag className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Top Placement</h3>
          <p className="text-sm text-gray-500 mb-3">Guaranteed top‑3 for 7 days</p>
          <p className="text-lg font-bold text-gray-900 mb-4">
            <img src="/coin.svg" alt="" className="h-4 w-4 inline-block mr-1" />
            {TOP_PLACEMENT_COST.toLocaleString()}
          </p>
          <button
            onClick={() => setShowTopPlacementModal(true)}
            disabled={coinBalance < TOP_PLACEMENT_COST}
            className="w-full bg-purple-600 text-white py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-sm"
          >
            {coinBalance < TOP_PLACEMENT_COST ? 'Not enough coins' : 'Get Top Spot'}
          </button>
        </div>
      </div>

      {/* Extra Category */}
      <button
        onClick={() => setShowExtraCategoryModal(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition mb-8"
      >
        <Package className="h-4 w-4 text-gray-500" />
        Add Extra Category ({EXTRA_CATEGORY_COST.toLocaleString()} Nicoin)
      </button>

      {/* Referrals */}
      <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Your Referrals</h2>
            <p className="text-sm text-gray-500">Earn {REFERRAL_BONUS} Nicoin per referral</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <code className="text-xl sm:text-2xl font-bold text-primary-600 bg-primary-50 px-4 py-2 rounded-xl tracking-wider">
              {referralCode || '—'}
            </code>
            <button onClick={copyReferralLink} className="p-2.5 text-gray-400 hover:text-primary-600 rounded-xl hover:bg-gray-100 transition" title="Copy link">
              <Copy className="h-5 w-5" />
            </button>
            <button onClick={shareReferralLink} className="p-2.5 text-gray-400 hover:text-primary-600 rounded-xl hover:bg-gray-100 transition" title="Share">
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{referralStats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-amber-600">{referralStats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">{referralStats.awarded}</p>
              <p className="text-xs text-gray-500">Awarded</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showBoostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-2">
              Activate {boostType === 'standard' ? 'Standard' : 'Premium'} Boost
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              {boostType === 'standard' ? STANDARD_BOOST_COST.toLocaleString() : PREMIUM_BOOST_COST.toLocaleString()} Nicoin will be deducted. Your profile will appear at the top for {boostType === 'standard' ? '7' : '30'} days.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowBoostModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium text-sm transition">Cancel</button>
              <button onClick={handleBoost} disabled={boostLoading} className="flex-1 bg-primary-600 text-white px-4 py-2.5 rounded-xl hover:bg-primary-700 disabled:opacity-50 font-medium text-sm transition">
                {boostLoading ? 'Activating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTopPlacementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-2">Activate Top Placement</h3>
            <p className="text-sm text-gray-500 mb-5">
              {TOP_PLACEMENT_COST.toLocaleString()} Nicoin will be deducted. You'll appear in the Top Providers slider for 7 days.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowTopPlacementModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium text-sm transition">Cancel</button>
              <button onClick={handleTopPlacement} disabled={boostLoading} className="flex-1 bg-purple-600 text-white px-4 py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50 font-medium text-sm transition">
                {boostLoading ? 'Activating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showExtraCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-2">Add Extra Category</h3>
            <p className="text-sm text-gray-500 mb-4">
              {EXTRA_CATEGORY_COST.toLocaleString()} Nicoin per category.
            </p>
            <select
              value={extraCategorySlug}
              onChange={(e) => setExtraCategorySlug(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowExtraCategoryModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium text-sm transition">Cancel</button>
              <button onClick={handleExtraCategory} disabled={boostLoading || !extraCategorySlug} className="flex-1 bg-primary-600 text-white px-4 py-2.5 rounded-xl hover:bg-primary-700 disabled:opacity-50 font-medium text-sm transition">
                {boostLoading ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}