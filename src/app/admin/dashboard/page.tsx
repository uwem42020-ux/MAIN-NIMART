// src/app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Users, UserCheck, UserX, MessageCircle, Mail, Shield, Calendar,
  AlertTriangle, Flag, CheckCircle, XCircle
} from 'lucide-react';
import { NimartSpinner } from '@/components/common/NimartSpinner';

const db = supabase as any;

interface Stats {
  totalUsers: number;
  totalProviders: number;
  totalCustomers: number;
  bannedUsers: number;
  openChats: number;
  totalBookings: number;
  disputedBookings: number;
  activeStrikes: number;
  pendingVerifications: number;
  flaggedBookings: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProviders: 0,
    totalCustomers: 0,
    bannedUsers: 0,
    openChats: 0,
    totalBookings: 0,
    disputedBookings: 0,
    activeStrikes: 0,
    pendingVerifications: 0,
    flaggedBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    const [
      profilesRes,
      providersRes,
      bannedRes,
      chatsRes,
      bookingsRes,
      disputedRes,
      strikesRes,
      verificationsRes,
      flagsRes,
    ] = await Promise.all([
      db.from('profiles').select('id', { count: 'exact', head: true }),
      db.from('providers').select('id', { count: 'exact', head: true }),
      db.from('profiles').select('id', { count: 'exact', head: true }).eq('is_banned', true),
      db.from('support_chats').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      db.from('bookings').select('id', { count: 'exact', head: true }),
      db.from('bookings').select('id', { count: 'exact', head: true }).eq('customer_confirmation_status', 'disputed'),
      db.from('provider_strikes').select('id', { count: 'exact', head: true }).gt('expires_at', new Date().toISOString()),
      db.from('verification_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      db.from('booking_flags').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    setStats({
      totalUsers: profilesRes.count || 0,
      totalProviders: providersRes.count || 0,
      totalCustomers: (profilesRes.count || 0) - (providersRes.count || 0),
      bannedUsers: bannedRes.count || 0,
      openChats: chatsRes.count || 0,
      totalBookings: bookingsRes.count || 0,
      disputedBookings: disputedRes.count || 0,
      activeStrikes: strikesRes.count || 0,
      pendingVerifications: verificationsRes.count || 0,
      flaggedBookings: flagsRes.count || 0,
    });
    setLoading(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <NimartSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Stats Grid - Row 1 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <Users className="h-8 w-8 text-primary-600 mb-2" />
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <UserCheck className="h-8 w-8 text-green-600 mb-2" />
              <p className="text-2xl font-bold">{stats.totalProviders}</p>
              <p className="text-sm text-gray-500">Providers</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <p className="text-2xl font-bold">{stats.totalCustomers}</p>
              <p className="text-sm text-gray-500">Customers</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <UserX className="h-8 w-8 text-red-600 mb-2" />
              <p className="text-2xl font-bold">{stats.bannedUsers}</p>
              <p className="text-sm text-gray-500">Banned</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <MessageCircle className="h-8 w-8 text-yellow-600 mb-2" />
              <p className="text-2xl font-bold">{stats.openChats}</p>
              <p className="text-sm text-gray-500">Open Chats</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <Calendar className="h-8 w-8 text-purple-600 mb-2" />
              <p className="text-2xl font-bold">{stats.totalBookings}</p>
              <p className="text-sm text-gray-500">Bookings</p>
            </div>
          </div>

          {/* Stats Grid - Row 2 (Trust & Safety) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <AlertTriangle className="h-8 w-8 text-orange-600 mb-2" />
              <p className="text-2xl font-bold">{stats.disputedBookings}</p>
              <p className="text-sm text-gray-500">Disputed</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <XCircle className="h-8 w-8 text-red-600 mb-2" />
              <p className="text-2xl font-bold">{stats.activeStrikes}</p>
              <p className="text-sm text-gray-500">Active Strikes</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <CheckCircle className="h-8 w-8 text-blue-600 mb-2" />
              <p className="text-2xl font-bold">{stats.pendingVerifications}</p>
              <p className="text-sm text-gray-500">Pending Verifications</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <Flag className="h-8 w-8 text-pink-600 mb-2" />
              <p className="text-2xl font-bold">{stats.flaggedBookings}</p>
              <p className="text-sm text-gray-500">Flagged Bookings</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link href="/admin/users" className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
              <Users className="h-8 w-8 text-primary-600 mb-4" />
              <h3 className="font-semibold text-gray-900">Manage Users</h3>
              <p className="text-sm text-gray-500">View, ban, or delete users</p>
            </Link>
            <Link href="/admin/chats" className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
              <MessageCircle className="h-8 w-8 text-primary-600 mb-4" />
              <h3 className="font-semibold text-gray-900">Support Chats</h3>
              <p className="text-sm text-gray-500">Respond to user inquiries</p>
            </Link>
            <Link href="/admin/email" className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
              <Mail className="h-8 w-8 text-primary-600 mb-4" />
              <h3 className="font-semibold text-gray-900">Bulk Email</h3>
              <p className="text-sm text-gray-500">Send emails to all users</p>
            </Link>
          </div>

          {/* Trust & Safety Quick Actions */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">Trust & Safety</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/reports" className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
              <AlertTriangle className="h-8 w-8 text-orange-600 mb-4" />
              <h3 className="font-semibold text-gray-900">Dispute Manager</h3>
              <p className="text-sm text-gray-500">Resolve customer‑provider disputes</p>
            </Link>
            <Link href="/admin/verifications" className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
              <Shield className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="font-semibold text-gray-900">Verifications</h3>
              <p className="text-sm text-gray-500">Review provider documents</p>
            </Link>
            <Link href="/admin/flags" className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
              <Flag className="h-8 w-8 text-pink-600 mb-4" />
              <h3 className="font-semibold text-gray-900">Booking Flags</h3>
              <p className="text-sm text-gray-500">Review flagged bookings</p>
            </Link>
          </div>

          {/* Referral Quick Action */}
          <div className="mt-6">
            <Link href="/admin/referrals" className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition inline-block w-full sm:w-auto">
              <Users className="h-8 w-8 text-primary-600 mb-4" />
              <h3 className="font-semibold text-gray-900">Referrals</h3>
              <p className="text-sm text-gray-500">Monitor referral program</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}