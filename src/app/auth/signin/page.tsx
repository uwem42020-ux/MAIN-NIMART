// src/app/auth/signin/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowLeft, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import { requestPushPermission } from '@/lib/pushNotifications';

export default function SignIn() {
  const router = useRouter();
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Signed in successfully');

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_complete, has_password')
        .eq('id', user?.id)
        .single();

      if (user && !profile?.has_password) {
        await supabase.from('profiles').update({ has_password: true }).eq('id', user.id);
      }

      if (user) await requestPushPermission(user.id);

      if (profile?.role === 'provider') {
        if (!profile.is_complete) {
          router.push('/provider/setup');
        } else {
          router.push('/provider/dashboard');
        }
      } else {
        router.push('/customer/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      toast.success('OTP sent to your email');
      setStep('otp');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
      if (error) throw error;
      toast.success('Signed in successfully');

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_complete')
        .eq('id', user?.id)
        .single();

      if (user) await requestPushPermission(user.id);

      if (profile?.role === 'provider') {
        if (!profile.is_complete) {
          router.push('/provider/setup');
        } else {
          router.push('/provider/dashboard');
        }
      } else {
        router.push('/customer/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <NimartSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4 py-6">
      {/* Back button */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 hover:text-primary-600 hover:bg-white shadow-sm transition"
        aria-label="Back to home"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <div className="w-full max-w-sm">
        {/* Mode switcher */}
        <div className="flex mb-5 bg-gray-100 rounded-xl p-1">
          <button
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              mode === 'password' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setMode('password')}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Lock className="h-4 w-4" /> Password
            </span>
          </button>
          <button
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              mode === 'otp' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setMode('otp');
              setStep('email');
            }}
          >
            <span className="flex items-center justify-center gap-1.5">
              <MessageSquare className="h-4 w-4" /> OTP
            </span>
          </button>
        </div>

        {/* Password form */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordSignIn} className="space-y-3">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
                  placeholder="••••••••"
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
            <div className="text-right">
              <Link href="/auth/reset-password" className="text-sm text-primary-600 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition font-semibold shadow-lg shadow-primary-600/20"
            >
              Sign In
            </button>
          </form>
        )}

        {/* OTP form */}
        {mode === 'otp' && (
          <>
            {step === 'email' ? (
              <form onSubmit={sendOTP} className="space-y-3">
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
                  className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition font-semibold shadow-lg shadow-primary-600/20"
                >
                  Send OTP
                </button>
              </form>
            ) : (
              <form onSubmit={verifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-2xl tracking-[0.3em] font-mono font-bold"
                    placeholder="00000000"
                    maxLength={8}
                  />
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    We sent an 8‑digit code to <span className="font-medium text-gray-700">{email}</span>
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition font-semibold shadow-lg shadow-primary-600/20"
                >
                  Verify & Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full flex items-center justify-center gap-1 text-sm text-primary-600 hover:underline font-medium"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to email
                </button>
              </form>
            )}
          </>
        )}

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white/80 text-gray-400 font-medium">or</span>
          </div>
        </div>

        {/* Social buttons – two columns */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition font-medium shadow-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-sm">Google</span>
          </button>
          <button
            onClick={handleFacebookSignIn}
            className="flex items-center justify-center gap-2 bg-[#1877F2] text-white py-3 rounded-xl hover:bg-[#166fe5] transition font-medium shadow-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="text-sm">Facebook</span>
          </button>
        </div>

        {/* Footer link */}
        <p className="mt-5 text-sm text-center text-gray-500">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-primary-600 hover:underline font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}