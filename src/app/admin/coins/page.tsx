// src/app/admin/coins/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { Search, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendEmail, sendPushNotification } from '@/lib/email';

export default function AdminCoins() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [coinAmount, setCoinAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    const { data: profiles, error } = await db
      .from('profiles')
      .select('id, full_name, email')
      .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(10);

    if (error || !profiles || profiles.length === 0) {
      toast.error('No providers found');
      setSearchResults([]);
      return;
    }

    const profileIds = profiles.map((p: any) => p.id);
    const { data: providers } = await db
      .from('providers')
      .select('id, coin_balance, business_name')
      .in('id', profileIds);

    const providerMap = new Map<string, any>();
    providers?.forEach((p: any) => providerMap.set(p.id, p));

    const merged = profiles
      .filter((p: any) => providerMap.has(p.id))
      .map((profile: any) => {
        const prov = providerMap.get(profile.id);
        return {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          provider: prov,
        };
      });

    setSearchResults(merged);
  };

  const handleAdjustCoins = async (type: 'add' | 'remove') => {
    if (!selectedProvider || !coinAmount) return;
    setLoading(true);
    try {
      const amount = parseInt(coinAmount);
      const finalAmount = type === 'add' ? amount : -amount;
      const { data: { user } } = await supabase.auth.getUser();

      await db.from('coin_transactions').insert({
        provider_id: selectedProvider.id,
        amount: finalAmount,
        type: type === 'add' ? 'admin_credit' : 'admin_deduction',
        admin_id: user!.id,
        reference_id: null,
      });

      await db.rpc('adjust_coin_balance', {
        p_provider_id: selectedProvider.id,
        p_amount: finalAmount,
      });

      toast.success(`${type === 'add' ? 'Added' : 'Removed'} ${Math.abs(finalAmount)} Nicoin`);

      if (selectedProvider.email) {
        await sendEmail(
          selectedProvider.email,
          'Nicoin Balance Updated',
          `<h2>Your Nicoin balance has been ${type === 'add' ? 'increased' : 'decreased'} by ${Math.abs(finalAmount)} coins.</h2>`
        );
      }

      const { data: providerProfile } = await db
        .from('profiles')
        .select('fcm_token')
        .eq('id', selectedProvider.id)
        .single();

      if (providerProfile?.fcm_token) {
        await sendPushNotification(
          providerProfile.fcm_token,
          'Nicoin Balance Updated',
          `Your balance has been ${type === 'add' ? 'increased' : 'decreased'} by ${Math.abs(finalAmount)} Nicoin.`
        );
      }

      setCoinAmount('');
      setReason('');

      const { data: refreshed } = await db
        .from('providers')
        .select('coin_balance')
        .eq('id', selectedProvider.id)
        .single();
      if (refreshed) {
        setSelectedProvider({
          ...selectedProvider,
          provider: { ...selectedProvider.provider, coin_balance: refreshed.coin_balance },
        });
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nicoin Management</h1>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search provider by name or email..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button
          onClick={handleSearch}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Search
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          {searchResults.map((profile: any) => (
            <button
              key={profile.id}
              onClick={() => setSelectedProvider(profile)}
              className={`w-full text-left p-4 hover:bg-gray-50 border-b last:border-0 ${
                selectedProvider?.id === profile.id ? 'bg-primary-50' : ''
              }`}
            >
              <p className="font-medium">{profile.full_name}</p>
              <p className="text-sm text-gray-500">{profile.email}</p>
              <p className="text-xs text-primary-600">
                Balance: {profile.provider?.coin_balance || 0} Nicoin
              </p>
            </button>
          ))}
        </div>
      )}

      {selectedProvider && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            {selectedProvider.full_name} – Current Balance: {selectedProvider.provider?.coin_balance || 0} Nicoin
          </h2>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                value={coinAmount}
                onChange={(e) => setCoinAmount(e.target.value)}
                min={1}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter amount"
              />
            </div>
            <button
              onClick={() => handleAdjustCoins('add')}
              disabled={loading || !coinAmount}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
            <button
              onClick={() => handleAdjustCoins('remove')}
              disabled={loading || !coinAmount}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Minus className="h-4 w-4" /> Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}