'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowLeft, Eye, EyeOff, CheckCircle, Send, Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('request-password-otp', {
        body: { email },
      });
      if (error) throw error;
      setStep('otp');
      toast.success('Code sent to your email');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and set new password
  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('verify-password-otp', {
        body: {
          email,
          otp,
          newPassword: password,
        },
      });
      if (error) throw error;
      setStep('success');
      toast.success('Password updated!');
    } catch (error: any) {
      toast.error(error.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSignIn = () => {
    router.push('/auth/signin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4 py-6">
      <Link
        href="/auth/signin"
        className="absolute top-6 left-6 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 hover:text-primary-600 hover:bg-white shadow-sm transition"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <div className="w-full max-w-sm">
        {step === 'email' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Reset Your Password</h2>
            <p className="text-sm text-gray-500 text-center mb-5">Enter your email to receive a reset code.</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition font-semibold shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2"
            >
              <Send className="h-5 w-5" />
              Send Code
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyAndReset} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Check Your Email</h2>
            <p className="text-sm text-gray-500 text-center mb-5">
              Enter the code sent to <strong>{email}</strong> and create a new password.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">6‑Digit Code</label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition text-center text-2xl tracking-widest"
                maxLength={6}
                placeholder="000000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
                  placeholder="••••••••"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition font-semibold shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              Reset Password
            </button>

            <button
              type="button"
              onClick={() => setStep('email')}
              className="text-sm text-center text-primary-600 hover:underline w-full"
            >
              ← Try a different email
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center space-y-5">
            <div className="bg-green-50 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Password Updated</h2>
            <p className="text-sm text-gray-600">
              You can now sign in with your new password.
            </p>
            <button
              onClick={handleGoToSignIn}
              className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 transition font-semibold"
            >
              Go to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}