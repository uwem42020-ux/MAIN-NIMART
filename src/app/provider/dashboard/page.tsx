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
  TrendingUp, Zap, Tag, Users, Copy, Share2, ChevronRight
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
    fetchProviderData();
    fetchStats();
    checkVerificationStatus();
    fetchReferralStats();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchCoinData();
  }, [user]);

  async function fetchCoinData() {
    const { data } = await db
      .from('providers')
      .select('coin_balance')
      .eq('id', user!.id)
      .single();
    if (data) setCoinBalance((data as any).coin_balance || 0);
  }

  async function fetchProviderData() {
    const { data: provider } = await db
      .from('providers')
      .select('*')
      .eq('id', user!.id)
      .single();
    const { data: profileData } = await db
      .from('profiles')
      .select('*')
      .eq('id', user!.id)
      .single();

    const combined = { ...(provider as any), profile: profileData };
    setProviderData(combined);
    setIsVerified((profileData as any)?.is_verified || false);

    if (provider && !(provider as any).referral_code) {
      const name = (provider as any).business_name || (profileData as any)?.full_name || 'Provider';
      const code = await generateUniqueReferralCode(name);
      await db.from('providers').update({ referral_code: code }).eq('id', user!.id);
      setReferralCode(code);
    } else if ((provider as any)?.referral_code) {
      setReferralCode((provider as any).referral_code);
    }

    if (combined && (!combined.profile?.lga_id || !combined.business_name)) {
      router.push('/provider/setup');
    }
  }

  async function fetchStats() {
    const { data: bookings } = await db
      .from('bookings')
      .select('*')
      .eq('provider_id', user!.id);
    const totalCount = (bookings as any[])?.length || 0;
    const pendingCount = (bookings as any[])?.filter((b: any) => b.status === 'pending').length || 0;
    const completedCount = (bookings as any[])?.filter((b: any) => b.status === 'completed').length || 0;
    const { data: reviews } = await db
      .from('reviews')
      .select('rating')
      .eq('provider_id', user!.id);
    const avgRating = (reviews as any[])?.length
      ? (reviews as any[]).reduce((acc: number, r: any) => acc + r.rating, 0) / (reviews as any[]).length
      : 0;
    setStats({
      totalBookings: totalCount,
      pendingBookings: pendingCount,
      completedBookings: completedCount,
      averageRating: avgRating,
      reviewCount: (reviews as any[])?.length || 0,
    });
  }

  async function checkVerificationStatus() {
    const { data } = await db
      .from('verification_documents')
      .select('status')
      .eq('provider_id', user!.id)
      .eq('status', 'pending')
      .limit(1);
    setHasPendingVerification(data && (data as any[]).length > 0);
  }

  async function fetchReferralStats() {
    const { count: total } = await db
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user!.id);
    const { count: pending } = await db
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user!.id)
      .eq('status', 'pending');
    const { count: awarded } = await db
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user!.id)
      .eq('status', 'awarded');
    setReferralStats({
      total: total || 0,
      pending: pending || 0,
      awarded: awarded || 0,
    });
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
      fetchCoinData();
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
      fetchCoinData();
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
      fetchCoinData();
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

  // Guard: if user is not yet loaded, show spinner
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NimartSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        {providerData && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">Select availability status:</span>
            <ProviderStatusToggle
              providerId={user.id}
              initialStatus={providerData.status}
              onStatusChange={() => fetchProviderData()}
            />
          </div>
        )}
      </div>

      {/* Verification Banners */}
      {!isVerified && !hasPendingVerification && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800">Get verified to build trust</p>
              <p className="text-sm text-blue-600">Verified providers get more bookings</p>
            </div>
          </div>
          <Link href="/provider/verification" className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm font-medium w-full sm:w-auto text-center">
            Get Verified
          </Link>
        </div>
      )}

      {hasPendingVerification && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <Shield className="h-6 w-6 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">Verification in progress</p>
            <p className="text-sm text-yellow-600">We're reviewing your documents. This usually takes 24-48 hours.</p>
          </div>
        </div>
      )}

      {isVerified && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <img src="/verify.png" alt="Verified" className="h-8 w-8" />
          <div>
            <p className="font-medium text-green-800">Your account is verified!</p>
            <p className="text-sm text-green-600">The verified badge appears on your profile.</p>
          </div>
        </div>
      )}

      {/* Nicoin Balance Card */}
      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl shadow-lg p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">Your Nicoin</p>
            <p className="text-3xl font-bold">
              <img src="/coin.svg" alt="Nicoin" className="h-6 w-6 inline-block mr-1" />
              {coinBalance.toLocaleString()}
            </p>
          </div>
          <Link href="/provider/payment" className="bg-white/20 text-white px-4 py-2 rounded-xl hover:bg-white/30 text-sm font-medium">
            Manage Coins →
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <Calendar className="h-6 w-6 text-primary-600 mb-2" />
          <p className="text-lg font-bold">{stats.totalBookings}</p>
          <p className="text-xs text-gray-500">Total Bookings</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <Calendar className="h-6 w-6 text-yellow-600 mb-2" />
          <p className="text-lg font-bold">{stats.pendingBookings}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <Calendar className="h-6 w-6 text-green-600 mb-2" />
          <p className="text-lg font-bold">{stats.completedBookings}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <Star className="h-6 w-6 text-yellow-400 mb-2" />
          <p className="text-lg font-bold">{stats.averageRating.toFixed(1)} <span className="text-xs text-gray-400">({stats.reviewCount})</span></p>
          <p className="text-xs text-gray-500">Rating</p>
        </div>
      </div>

      {/* Setup Checklist */}
      {providerData && (!providerData.profile?.lga_id || !providerData.business_name) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded-r-xl">
          <div className="flex">
            <Settings className="h-5 w-5 text-yellow-400 mr-2" />
            <p className="text-sm text-yellow-700">
              Complete your profile to appear in searches. <Link href="/provider/setup" className="font-medium underline">Complete Setup</Link>
            </p>
          </div>
        </div>
      )}

      {/* Boost Cards */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Boost Your Visibility</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Standard Boost */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <TrendingUp className="h-6 w-6 text-primary-600 mb-2" />
          <h3 className="font-semibold">Standard Boost</h3>
          <p className="text-sm text-gray-500 mb-3">7 days at top</p>
          <p className="text-lg font-bold mb-4">{STANDARD_BOOST_COST.toLocaleString()} Nicoin</p>
          <button
            onClick={() => { setBoostType('standard'); setShowBoostModal(true); }}
            disabled={coinBalance < STANDARD_BOOST_COST}
            className="w-full bg-primary-600 text-white py-2.5 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition font-medium text-sm"
          >
            Boost Now
          </button>
        </div>

        {/* Premium Boost */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 ring-2 ring-amber-200">
          <Zap className="h-6 w-6 text-amber-500 mb-2" />
          <h3 className="font-semibold">Premium Boost</h3>
          <p className="text-sm text-gray-500 mb-3">30 days at top</p>
          <p className="text-lg font-bold mb-4">{PREMIUM_BOOST_COST.toLocaleString()} Nicoin</p>
          <button
            onClick={() => { setBoostType('premium'); setShowBoostModal(true); }}
            disabled={coinBalance < PREMIUM_BOOST_COST}
            className="w-full bg-amber-500 text-white py-2.5 rounded-xl hover:bg-amber-600 disabled:opacity-50 transition font-medium text-sm"
          >
            Boost 1 Month
          </button>
        </div>

        {/* Top Placement */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <Tag className="h-6 w-6 text-purple-600 mb-2" />
          <h3 className="font-semibold">Top Placement</h3>
          <p className="text-sm text-gray-500 mb-3">Guaranteed top‑3 for 7 days</p>
          <p className="text-lg font-bold mb-4">{TOP_PLACEMENT_COST.toLocaleString()} Nicoin</p>
          <button
            onClick={() => setShowTopPlacementModal(true)}
            disabled={coinBalance < TOP_PLACEMENT_COST}
            className="w-full bg-purple-600 text-white py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition font-medium text-sm"
          >
            Get Top Spot
          </button>
        </div>
      </div>

      {/* Extra Category */}
      <div className="mb-8">
        <button
          onClick={() => setShowExtraCategoryModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50"
        >
          <Package className="h-4 w-4" /> Add Extra Category ({EXTRA_CATEGORY_COST.toLocaleString()} Nicoin)
        </button>
      </div>

      {/* Your Referrals Widget */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-600" />
            Your Referrals
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Your Referral Code</p>
            <div className="flex items-center gap-2">
              <code className="text-2xl font-bold text-primary-600 bg-primary-50 px-4 py-2 rounded-lg">
                {referralCode || '—'}
              </code>
              <button
                onClick={copyReferralLink}
                className="p-2 text-gray-500 hover:text-primary-600 rounded-full hover:bg-gray-100 transition"
                title="Copy referral link"
              >
                <Copy className="h-5 w-5" />
              </button>
              <button
                onClick={shareReferralLink}
                className="p-2 text-gray-500 hover:text-primary-600 rounded-full hover:bg-gray-100 transition"
                title="Share"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Share your link and earn {REFERRAL_BONUS} Nicoin for every new provider who completes their first booking.
            </p>
          </div>

          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{referralStats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{referralStats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{referralStats.awarded}</p>
              <p className="text-xs text-gray-500">Awarded</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Link href="/provider/bookings" className="bg-white rounded-2xl shadow-sm border p-4 hover:shadow-md transition text-center">
          <Calendar className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <h3 className="font-semibold text-sm">Bookings</h3>
        </Link>
        <Link href="/provider/portfolio" className="bg-white rounded-2xl shadow-sm border p-4 hover:shadow-md transition text-center">
          <Image className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <h3 className="font-semibold text-sm">Portfolio</h3>
        </Link>
        <Link href="/provider/services" className="bg-white rounded-2xl shadow-sm border p-4 hover:shadow-md transition text-center">
          <Package className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <h3 className="font-semibold text-sm">Services</h3>
        </Link>
        <Link href="/provider/verification" className="bg-white rounded-2xl shadow-sm border p-4 hover:shadow-md transition text-center">
          <Shield className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <h3 className="font-semibold text-sm">Get Verified</h3>
        </Link>
        <Link href="/provider/profile" className="bg-white rounded-2xl shadow-sm border p-4 hover:shadow-md transition text-center">
          <Settings className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <h3 className="font-semibold text-sm">Settings</h3>
        </Link>
      </div>

      {/* Modals */}
      {showBoostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-2">
              Activate {boostType === 'standard' ? 'Standard' : 'Premium'} Boost
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {boostType === 'standard' ? STANDARD_BOOST_COST.toLocaleString() : PREMIUM_BOOST_COST.toLocaleString()} Nicoin will be deducted. Your profile will appear at the top for {boostType === 'standard' ? '7 days' : '30 days'}.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowBoostModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleBoost} disabled={boostLoading} className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {boostLoading ? 'Activating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTopPlacementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-2">Activate Top Placement</h3>
            <p className="text-sm text-gray-600 mb-4">
              {TOP_PLACEMENT_COST.toLocaleString()} Nicoin will be deducted. You'll appear in the Top Providers slider for 7 days.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowTopPlacementModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleTopPlacement} disabled={boostLoading} className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50">
                {boostLoading ? 'Activating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showExtraCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-2">Add Extra Category</h3>
            <p className="text-sm text-gray-600 mb-4">
              {EXTRA_CATEGORY_COST.toLocaleString()} Nicoin per category. Pick one to add to your profile.
            </p>
            <select
              value={extraCategorySlug}
              onChange={(e) => setExtraCategorySlug(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-4"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowExtraCategoryModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleExtraCategory} disabled={boostLoading || !extraCategorySlug} className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {boostLoading ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}