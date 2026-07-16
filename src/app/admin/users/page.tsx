// src/app/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { Search, Ban, Trash2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { NimartSpinner } from '@/components/common/NimartSpinner';

interface AdminUser {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: 'customer' | 'provider';
  is_banned: boolean;
  created_at: string;
  email: string | null;
  business_name: string | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'customer' | 'provider' | 'banned'>('all');

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  async function fetchUsers() {
    setLoading(true);

    const { data: profiles, error: profilesError } = await db
      .from('profiles')
      .select('id, full_name, phone, role, is_banned, created_at, email')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      toast.error('Failed to load users');
      setUsers([]);
      setLoading(false);
      return;
    }

    const { data: providers, error: providersError } = await db
      .from('providers')
      .select('id, business_name');

    if (providersError) {
      console.error('Error fetching providers:', providersError);
    }

    const providerMap = new Map();
    (providers || []).forEach((p: any) => providerMap.set(p.id, p.business_name));

    let usersList = (profiles || []).map((profile: any) => ({
      ...profile,
      business_name: providerMap.get(profile.id) || null,
    }));

    if (filter === 'customer') {
      usersList = usersList.filter((u: any) => u.role === 'customer');
    } else if (filter === 'provider') {
      usersList = usersList.filter((u: any) => u.role === 'provider');
    } else if (filter === 'banned') {
      usersList = usersList.filter((u: any) => u.is_banned);
    }

    setUsers(usersList);
    setLoading(false);
  }

  async function handleBanUser(userId: string, currentStatus: boolean) {
    const reason = prompt('Reason for ' + (currentStatus ? 'unbanning' : 'banning') + ' this user:');
    if (reason === null) return;

    try {
      const { error } = await db
        .from('profiles')
        .update({
          is_banned: !currentStatus,
          banned_at: !currentStatus ? new Date().toISOString() : null,
          banned_reason: !currentStatus ? reason : null,
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success(currentStatus ? 'User unbanned' : 'User banned');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('Are you sure? This will permanently delete the user and ALL associated data (bookings, messages, portfolio, etc.).')) return;

    try {
      const { error } = await supabase.rpc('admin_delete_user', { user_id: userId });

      if (error) throw error;
      toast.success('User permanently deleted');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const filteredUsers = users.filter((u: any) => {
    const term = searchTerm.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.business_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Users</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or business..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Users</option>
          <option value="customer">Customers Only</option>
          <option value="provider">Providers Only</option>
          <option value="banned">Banned Users</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <NimartSpinner size="md" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Joined</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((user: any) => (
                <tr key={user.id} className={cn(user.is_banned && 'bg-red-50')}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{user.full_name || 'Unnamed'}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.business_name && (
                        <p className="text-xs text-primary-600">{user.business_name}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      user.role === 'provider' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_banned ? (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        Banned
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleBanUser(user.id, user.is_banned)}
                        className={cn(
                          'p-2 rounded hover:bg-gray-100',
                          user.is_banned ? 'text-green-600' : 'text-yellow-600'
                        )}
                        title={user.is_banned ? 'Unban User' : 'Ban User'}
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-red-600 rounded hover:bg-red-50"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">No users found</div>
          )}
        </div>
      )}
    </div>
  );
}