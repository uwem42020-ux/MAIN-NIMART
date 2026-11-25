// src/app/provider/payment/ProviderPaymentClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import {
  Send, ArrowUpRight, ArrowDownLeft, Search, Coins, Info, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import { PaystackButton } from 'react-paystack';

export default function ProviderPaymentClient() {
  const { user } = useAuth();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [walletLoading, setWalletLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [shareAmount, setShareAmount] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [coinInfoExpanded, setCoinInfoExpanded] = useState(false);

  const publicKey = (process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '') as string;

  useEffect(() => {
    if (!user) return;
    fetchWalletData();
  }, [user]);

  async function fetchWalletData() {
    setWalletLoading(true);
    try {
      const [providerRes, txnsRes] = await Promise.all([
        db.from('providers').select('coin_balance').eq('id', user!.id).single(),
        db.from('coin_transactions').select('*').eq('provider_id', user!.id)
          .order('created_at', { ascending: false }).limit(50),
      ]);
      if (providerRes.data) setBalance((providerRes.data as any).coin_balance || 0);
      setTransactions(txnsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setWalletLoading(false);
    }
  }

  const verifyPassword = async () => {
    if (!password) { setPasswordError('Password is required'); return false; }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: user!.email!, password });
      if (error) { setPasswordError('Incorrect password'); return false; }
      setPasswordError('');
      return true;
    } catch {
      setPasswordError('Verification failed');
      return false;
    }
  };

  const initiateSendCoins = () => {
    if (!selectedRecipient || !shareAmount) return;
    setPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handleSendAfterPassword = async () => {
    const verified = await verifyPassword();
    if (!verified) return;
    setShowPasswordModal(false);
    await executeSendCoins();
  };

  const executeSendCoins = async () => {
    setShareLoading(true);
    try {
      const amt = parseInt(shareAmount);
      await db.rpc('adjust_coin_balance', { p_provider_id: user!.id, p_amount: -amt });
      await db.rpc('adjust_coin_balance', { p_provider_id: selectedRecipient.id, p_amount: amt });
      await db.from('coin_transactions').insert([
        { provider_id: user!.id, amount: -amt, type: 'transfer_out', reference_id: selectedRecipient.id },
        { provider_id: selectedRecipient.id, amount: amt, type: 'transfer_in', reference_id: user!.id },
      ]);
      toast.success(`${amt} Nicoin sent to ${selectedRecipient.full_name}`);
      setShareAmount('');
      setSelectedRecipient(null);
      setSearchResults([]);
      setSearchTerm('');
      fetchWalletData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setShareLoading(false);
    }
  };

  const handleSearchProvider = async () => {
    if (!searchTerm.trim()) return;
    const { data: profiles } = await db.from('profiles')
      .select('id, full_name, email')
      .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(10);
    if (!profiles) return;
    const profileIds = (profiles as any[]).map((p: any) => p.id);
    const { data: providers } = await db.from('providers').select('id').in('id', profileIds);
    const providerIds = new Set((providers as any[])?.map((p: any) => p.id));
    const filtered = (profiles as any[]).filter((p: any) => p.id !== user!.id && providerIds.has(p.id));
    setSearchResults(filtered);
  };

  const nicoinAmount = amount ? parseInt(amount) : 0;

  const paystackConfig = {
    email: user?.email || '',
    amount: amount ? parseInt(amount) * 100 : 0,
    publicKey,
    metadata: { provider_id: user?.id, custom_fields: [] as any[] },
    onSuccess: () => {
      toast.success('Payment successful! Nicoin will be credited shortly.');
      setAmount('');
      fetchWalletData();
    },
    onClose: () => toast.error('Payment cancelled'),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Nicoin Wallet</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your balance, buy Nicoin, and send to other providers</p>
      </div>

      {/* Coin Explanation */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
        <button
          onClick={() => setCoinInfoExpanded(!coinInfoExpanded)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary-50">
              <Info className="h-4 w-4 text-primary-600" />
            </div>
            <span className="font-semibold text-slate-900">How Nicoin works</span>
          </div>
          <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${coinInfoExpanded ? 'rotate-180' : ''}`} />
        </button>
        {coinInfoExpanded && (
          <div className="px-5 pb-5 text-sm text-slate-600 space-y-2.5 border-t border-slate-100 pt-4">
            <p><strong className="text-slate-900">Nicoin</strong> is Nimart's virtual currency. Use it to boost your profile, get top placement, and unlock extra features.</p>
            <p><strong className="text-slate-900">Exchange rate:</strong> <span className="text-primary-600 font-semibold">₦1 = 1 Nicoin</span></p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              {[100, 200, 500, 1000].map((n) => (
                <div key={n} className="bg-slate-50 rounded-lg px-3 py-2 text-center text-xs">
                  <span className="text-slate-900 font-semibold">₦{n}</span>
                  <span className="text-slate-400 mx-1">→</span>
                  <span className="text-primary-600 font-semibold">{n} Nicoin</span>
                </div>
              ))}
            </div>
            <p>Pay instantly with Paystack and your Nicoin will be credited automatically. You can also send Nicoin to other providers.</p>
          </div>
        )}
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-sm font-medium text-amber-50 mb-2">Current Balance</p>
          <p className="text-5xl font-bold tracking-tight flex items-baseline gap-2">
            <Coins className="h-9 w-9" />
            {balance.toLocaleString()}
            <span className="text-xl font-medium text-amber-50">Nicoin</span>
          </p>
        </div>
      </div>

      {/* Buy Nicoin */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/60 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-1">Buy Nicoin</h2>
        <p className="text-slate-500 text-sm mb-6">Enter the amount you want to purchase. You'll be redirected to Paystack to complete your payment securely.</p>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Amount (₦)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min={100}
              step={100}
              className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition outline-none text-slate-900"
              placeholder="e.g., 1000"
            />
            {amount && parseInt(amount) >= 100 && (
              <p className="text-sm text-primary-600 mt-2">You'll receive <strong>{nicoinAmount} Nicoins</strong></p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {[500, 1000, 2500, 5000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt.toString())}
                className="px-4 py-2 bg-slate-100 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-200 transition"
              >
                ₦{amt.toLocaleString()}
              </button>
            ))}
          </div>
          <PaystackButton
            {...paystackConfig}
            className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-primary-600/20"
            text="Pay"
            disabled={!amount || parseInt(amount) < 100}
          />
        </div>
      </div>

      {/* Send Coins */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/60 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Send className="h-5 w-5 text-slate-500" /> Send Coins to Another Provider
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search provider by name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition outline-none text-slate-900 placeholder:text-slate-400"
              onKeyDown={(e) => e.key === 'Enter' && handleSearchProvider()}
            />
          </div>
          <button
            onClick={handleSearchProvider}
            className="bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 text-sm font-medium transition"
          >
            Search
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="rounded-xl mb-3 max-h-40 overflow-y-auto ring-1 ring-slate-200 bg-white">
            {searchResults.map((p: any) => (
              <button
                key={p.id}
                onClick={() => setSelectedRecipient(p)}
                className={`w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition ${selectedRecipient?.id === p.id ? 'bg-primary-50' : ''}`}
              >
                <p className="font-medium text-sm text-slate-900">{p.full_name}</p>
                <p className="text-xs text-slate-500">{p.email}</p>
              </button>
            ))}
          </div>
        )}
        {selectedRecipient && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2 p-3 bg-slate-50 rounded-xl">
            <p className="text-sm font-medium text-slate-700">To: {selectedRecipient.full_name}</p>
            <input
              type="number"
              value={shareAmount}
              onChange={(e) => setShareAmount(e.target.value)}
              placeholder="Amount"
              className="w-full sm:w-28 px-3 py-2 bg-white border-0 ring-1 ring-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none text-slate-900"
              min={1}
            />
            <button
              onClick={initiateSendCoins}
              disabled={shareLoading || !shareAmount}
              className="bg-amber-500 text-white px-5 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
            >
              {shareLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/60 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Transaction History</h2>
        {walletLoading ? (
          <div className="flex justify-center py-8"><NimartSpinner size="md" /></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <Coins className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-4 hover:bg-slate-100/70 transition">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    {tx.amount > 0 ? <ArrowDownLeft className="h-5 w-5 text-green-600" /> : <ArrowUpRight className="h-5 w-5 text-red-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm capitalize text-slate-900">{tx.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-500">{format(new Date(tx.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
                <p className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} Nicoin
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Verify Your Identity</h3>
            <p className="text-sm text-slate-500 mb-5">For security, please enter your account password to send Nicoin.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                  className="w-full px-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition outline-none text-slate-900"
                  placeholder="Enter your password"
                />
                {passwordError && <p className="text-xs text-red-600 mt-1.5">{passwordError}</p>}
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendAfterPassword}
                  disabled={shareLoading}
                  className="flex-1 bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium text-sm transition"
                >
                  Verify & Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}