// src/app/auth/reset-password/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowLeft, Eye, EyeOff, CheckCircle, Send, Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Check if the URL contains a recovery token
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setIsResetMode(true);

      // Let Supabase pick up the token from the hash
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSessionReady(true);
        } else {
          toast.error('Reset link expired or invalid.');
          router.push('/auth/signin');
        }
      });
    }
  }, [router]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setEmailSent(true);
      toast.success('Reset link sent to your email');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Mark profile as having a password
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await db.from('profiles').update({ has_password: true }).eq('id', user.id);
      }

      toast.success('Password updated! Please sign in.');
      await supabase.auth.signOut();
      router.push('/auth/signin');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Show spinner while session is being retrieved
  if (isResetMode && !sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4 py-6">
      {/* Back button */}
      <Link
        href="/auth/signin"
        className="absolute top-6 left-6 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 hover:text-primary-600 hover:bg-white shadow-sm transition"
        aria-label="Back to sign in"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <div className="w-full max-w-sm">
        {!isResetMode ? (
          <>
            {!emailSent ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Reset Your Password</h2>
                <p className="text-sm text-gray-500 text-center mb-5">
                  Enter your email and we'll send you a reset link.
                </p>

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
                  Send Reset Link
                </button>
                <p className="text-sm text-center text-gray-500">
                  Remember your password?{' '}
                  <Link href="/auth/signin" className="text-primary-600 hover:underline font-semibold">
                    Sign in
                  </Link>
                </p>
              </form>
            ) : (
              <div className="text-center space-y-5">
                <div className="bg-green-50 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
                <p className="text-sm text-gray-600">
                  We've sent a password reset link to <span className="font-medium">{email}</span>.
                </p>
                <p className="text-xs text-gray-500">
                  Didn't receive it? Check spam or{' '}
                  <button onClick={() => setEmailSent(false)} className="text-primary-600 hover:underline">
                    try again
                  </button>
                </p>
                <Link
                  href="/auth/signin"
                  className="block w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 transition font-semibold"
                >
                  Back to Sign In
                </Link>
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Set New Password</h2>
            <p className="text-sm text-gray-500 text-center mb-5">Choose a new, strong password.</p>

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
              className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition font-semibold shadow-lg shadow-primary-600/20"
            >
              Update Password
            </button>

            <p className="text-sm text-center text-gray-500">
              <Link href="/auth/signin" className="text-primary-600 hover:underline font-semibold">
                Back to Sign In
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}