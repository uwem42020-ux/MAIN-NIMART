// src/app/customer/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  CheckCircle,
  Search,
  User,
  Star,
  ArrowRight,
  Settings,
  Heart,
  Briefcase,
} from 'lucide-react';
import { LocationPrompt } from '@/components/customer/LocationPrompt';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import { FavoriteButton } from '@/components/common/FavoriteButton';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  upcomingBookings: number;
}

interface BookingWithProvider {
  id: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  status: string;
  provider_id: string;
  provider?: {
    business_name: string | null;
    profile: {
      full_name: string | null;
    } | null;
  };
}

export default function CustomerDashboard() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    upcomingBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState<BookingWithProvider[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
    fetchFavorites();
  }, [user]);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_id', user!.id)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (error) throw error;
      if (!bookings) {
        setStats({ totalBookings: 0, pendingBookings: 0, completedBookings: 0, upcomingBookings: 0 });
        setRecentBookings([]);
        setLoading(false);
        return;
      }

      const providerIds = [...new Set(bookings.map(b => b.provider_id))];

      const { data: providers } = await supabase
        .from('providers')
        .select('id, business_name')
        .in('id', providerIds);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', providerIds);

      const providerMap = new Map();
      providers?.forEach(p => {
        const prof = profiles?.find(pr => pr.id === p.id);
        providerMap.set(p.id, {
          business_name: p.business_name,
          profile: { full_name: prof?.full_name || null },
        });
      });

      const bookingsWithProviders = bookings.map(booking => ({
        ...booking,
        provider: providerMap.get(booking.provider_id) || null,
      }));

      const today = new Date().toISOString().split('T')[0];
      const pending = bookings.filter(b => b.status === 'pending').length;
      const completed = bookings.filter(b => b.status === 'completed').length;
      const upcoming = bookings.filter(b => b.booking_date >= today && ['pending', 'confirmed'].includes(b.status)).length;

      setStats({
        totalBookings: bookings.length,
        pendingBookings: pending,
        completedBookings: completed,
        upcomingBookings: upcoming,
      });

      setRecentBookings(bookingsWithProviders.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFavorites() {
    const { data } = await supabase
      .from('favorite_providers')
      .select('provider_id')
      .eq('customer_id', user!.id);

    if (!data?.length) {
      setFavorites([]);
      return;
    }

    const providerIds = data.map(f => f.provider_id);
    const { data: providers } = await supabase
      .from('providers')
      .select('id, business_name, selected_category_slug')
      .in('id', providerIds);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, lga_name, state_name')
      .in('id', providerIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    setFavorites(
      (providers || []).map(p => ({
        ...p,
        profile: profileMap.get(p.id) || {},
      }))
    );
  }

  const handleSwitchToProvider = async () => {
    if (!window.confirm(
      'Switch to a Provider account?\n\nYou will keep your email and account. You\'ll just need to complete your business profile to appear on the map and search results.'
    )) return;

    setSwitching(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'provider', is_complete: false })
        .eq('id', user!.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Switched to Provider! Complete your business profile now.');
      router.push('/provider/setup');
    } catch (err: any) {
      toast.error(err.message || 'Failed to switch. Please try again.');
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NimartSpinner size="lg" />
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Customer';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <LocationPrompt />

      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {firstName}!
        </h1>
        <p className="text-gray-600 mt-1">Here's an overview of your activity.</p>
      </div>

      {/* Switch to Provider Card */}
      <div className="bg-gradient-to-r from-primary-600 to-green-600 rounded-xl shadow-md p-6 mb-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Briefcase className="h-6 w-6" />
              Offer Your Services?
            </h2>
            <p className="mt-1 text-green-50 text-sm max-w-md">
              Switch to a Provider account, set up your business profile, and start getting customers directly.
            </p>
          </div>
          <button
            onClick={handleSwitchToProvider}
            disabled={switching}
            className="bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            {switching ? 'Switching...' : (
              <>
                Switch to Provider <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <Calendar className="h-6 w-6 text-primary-600 mb-2" />
          <p className="text-lg font-bold">{stats.totalBookings}</p>
          <p className="text-xs text-gray-500">Total Bookings</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <Clock className="h-6 w-6 text-yellow-600 mb-2" />
          <p className="text-lg font-bold">{stats.pendingBookings}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <CheckCircle className="h-6 w-6 text-green-600 mb-2" />
          <p className="text-lg font-bold">{stats.completedBookings}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <Calendar className="h-6 w-6 text-blue-600 mb-2" />
          <p className="text-lg font-bold">{stats.upcomingBookings}</p>
          <p className="text-xs text-gray-500">Upcoming</p>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/search"
          className="bg-white rounded-2xl shadow-sm border p-4 hover:shadow-md transition text-center"
        >
          <Search className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <h3 className="font-semibold text-sm">Find Services</h3>
        </Link>
        <Link
          href="/customer/bookings"
          className="bg-white rounded-2xl shadow-sm border p-4 hover:shadow-md transition text-center"
        >
          <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-semibold text-sm">My Bookings</h3>
        </Link>
        <Link
          href="/customer/profile"
          className="bg-white rounded-2xl shadow-sm border p-4 hover:shadow-md transition text-center"
        >
          <Settings className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <h3 className="font-semibold text-sm">Profile Settings</h3>
        </Link>
      </div>

      {/* Saved Providers */}
      {favorites.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Saved Providers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {favorites.map((fav: any) => (
              <Link
                key={fav.id}
                href={`/provider/${fav.id}`}
                className="bg-white rounded-2xl shadow-sm border p-4 hover:shadow-md transition text-center relative"
              >
                <div className="absolute top-2 right-2">
                  <FavoriteButton providerId={fav.id} size="sm" />
                </div>
                {fav.profile?.avatar_url ? (
                  <img src={fav.profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover mx-auto mb-2" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-2">
                    <span className="text-primary-600 font-semibold text-xl">
                      {(fav.business_name || fav.profile?.full_name)?.[0] || 'P'}
                    </span>
                  </div>
                )}
                <h3 className="font-semibold text-sm truncate">
                  {fav.business_name || fav.profile?.full_name || 'Provider'}
                </h3>
                {fav.profile?.lga_name && (
                  <p className="text-xs text-gray-500 truncate">{fav.profile.lga_name}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
          <Link
            href="/customer/bookings"
            className="text-sm text-primary-600 hover:underline font-medium flex items-center gap-1"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-3 text-gray-500 font-medium">No bookings yet.</p>
            <p className="text-sm text-gray-400 mt-1">Find a provider and book your first service.</p>
            <Link
              href="/search"
              className="mt-4 inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition text-sm font-medium"
            >
              <Search className="h-4 w-4" /> Find a Provider
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl"
              >
                <div>
                  <p className="font-medium text-sm">{booking.service_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {booking.provider?.business_name ||
                      booking.provider?.profile?.full_name ||
                      'Unknown Provider'}{' '}
                    • {booking.booking_date} at {booking.booking_time}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : booking.status === 'confirmed'
                      ? 'bg-blue-100 text-blue-800'
                      : booking.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {booking.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}