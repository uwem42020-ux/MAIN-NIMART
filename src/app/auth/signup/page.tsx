// src/app/auth/signup/page.tsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { User, Briefcase, Mail, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import { requestPushPermission } from '@/lib/pushNotifications';
import { REFERRAL_BONUS } from '@/lib/nicoinConfig';

type Step = 'email' | 'otp' | 'profile';

// ── Countdown Timer ──
function CountdownTimer({ initialSeconds, onExpire }: { initialSeconds: number; onExpire: () => void }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (seconds <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
      return;
    }
    const interval = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(interval);
  }, [seconds, onExpire]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <p className={`text-center text-sm font-medium transition-colors ${seconds <= 30 ? 'text-red-500' : 'text-gray-400'}`}>
      {seconds > 0
        ? `Code expires in ${minutes}:${secs.toString().padStart(2, '0')}`
        : 'Code expired'}
    </p>
  );
}

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('.signup-container')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'provider') setRole('provider');
    else if (roleParam === 'customer') setRole('customer');
    const refParam = searchParams.get('ref');
    if (refParam) setReferralCode(refParam.trim().toUpperCase());
  }, [searchParams]);

  useEffect(() => {
    if (step === 'email' && emailInputRef.current) emailInputRef.current.focus();
    if (step === 'otp' && otpInputRef.current) otpInputRef.current.focus();
    if (step === 'profile' && nameInputRef.current) nameInputRef.current.focus();
  }, [step]);

  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      toast.success('Check your email for the verification code');
      scrollToTop();
      setStep('otp');
    } catch (error: any) {
      scrollToTop();
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });
      if (error) throw error;
      toast.success('Email verified!');
      scrollToTop();
      setStep('profile');
    } catch (error: any) {
      scrollToTop();
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const completeProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { toast.error('Please enter your full name'); return; }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: existingProfile } = await db
        .from('profiles').select('role').eq('id', user.id).single();

      if (existingProfile?.role) {
        await supabase.auth.signOut();
        router.push('/auth/signin');
        toast.error(`This email is already registered as a ${existingProfile.role}. Please sign in.`);
        return;
      }

      if (role === 'provider' && referralCode.trim()) {
        const { data: referrer } = await db
          .from('providers').select('id').eq('referral_code', referralCode.trim().toUpperCase()).single();
        if (!referrer) {
          toast.error('Referral code not found.');
          setLoading(false);
          return;
        }
        if (referrer.id === user.id) {
          toast.error('You cannot refer yourself.');
          setLoading(false);
          return;
        }
        await db.from('providers').update({ referred_by: referrer.id }).eq('id', user.id);
        await db.from('referrals').insert({ referrer_id: referrer.id, referred_provider_id: user.id });
      }

      if (role === 'customer') {
        await db.from('profiles').update({ full_name: fullName, role, is_complete: true }).eq('id', user.id);
        await refreshProfile();
        toast.success('Welcome to Nimart!');
        await requestPushPermission(user.id);
        router.push('/customer/dashboard');
        return;
      }

      await db.from('profiles').update({ full_name: fullName, role, is_complete: false }).eq('id', user.id);
      await refreshProfile();
      toast.success('Account created! Let\'s set up your profile.');
      await requestPushPermission(user.id);
      router.push('/provider/setup');
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete signup');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
      });
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

  const steps = ['email', 'otp', 'profile'] as Step[];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col">
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 hover:text-primary-600 hover:bg-white shadow-sm transition"
        aria-label="Back to home"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <div className="flex-1 flex items-center justify-center px-4 py-12 signup-container">
        <div className="w-full max-w-md">
          {/* ── Progress Steps ── */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((s, i) => {
              const isActive = step === s;
              const isCompleted = steps.indexOf(step) > i;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                      isActive
                        ? 'bg-primary-600 text-white scale-110 shadow-lg shadow-primary-600/30 animate-pulse'
                        : isCompleted
                        ? 'bg-primary-200 text-primary-700'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : i + 1}
                  </div>
                  {i < 2 && (
                    <div className={`w-10 h-0.5 transition-colors duration-500 ${isCompleted ? 'bg-primary-300' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
            {/* Step 1: Email */}
            {step === 'email' && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Create your account</h2>
                <p className="text-sm text-gray-500 text-center mb-6">Join Nigeria's trusted service marketplace</p>

                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-primary-500 text-gray-700 py-3 rounded-xl hover:bg-primary-50 transition font-medium shadow-md mb-6"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                  <div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-gray-400 font-medium">or sign up with email</span></div>
                </div>

                <form onSubmit={sendOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input ref={emailInputRef} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition" placeholder="you@example.com" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition font-semibold shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2">
                    Continue <ArrowRight className="h-5 w-5" />
                  </button>
                </form>

                <p className="mt-6 text-sm text-center text-gray-500">Already have an account? <Link href="/auth/signin" className="text-primary-600 hover:underline font-semibold">Sign in</Link></p>
              </>
            )}

            {/* Step 2: OTP */}
            {step === 'otp' && (
              <form onSubmit={verifyOTP} className="space-y-5">
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Check your email</h2>
                <p className="text-sm text-gray-500 text-center mb-6">We sent an 8‑digit code to <span className="font-medium text-gray-700">{email}</span></p>
                <div>
                  <input
                    ref={otpInputRef}
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setOtp(cleaned);
                    }}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-2xl tracking-[0.3em] font-mono font-bold"
                    placeholder="00000000"
                    maxLength={8}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>

                <CountdownTimer initialSeconds={600} onExpire={() => toast.error('Code expired. Request a new one.')} />

                <button type="submit" disabled={loading || otp.length !== 8} className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition font-semibold shadow-lg shadow-primary-600/20">
                  Verify & Continue
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
                      setLoading(false);
                      if (error) toast.error(error.message);
                      else toast.success('New code sent!');
                    }}
                    className="text-sm text-primary-600 hover:underline font-medium"
                  >
                    Resend code
                  </button>
                </div>

                <button type="button" onClick={() => setStep('email')} className="w-full flex items-center justify-center gap-1 text-sm text-primary-600 hover:underline font-medium">
                  <ArrowLeft className="h-4 w-4" />Back to email
                </button>
              </form>
            )}

            {/* Step 3: Profile */}
            {step === 'profile' && (
              <form onSubmit={completeProfile} className="space-y-5">
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Complete your profile</h2>
                <p className="text-sm text-gray-500 text-center mb-6">Just a few more details</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input ref={nameInputRef} type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition" placeholder="John Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code (optional)</label>
                  <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition" placeholder="Enter referral code" maxLength={12} />
                  <p className="text-xs text-gray-500 mt-1">Both you and the referrer earn {REFERRAL_BONUS} Nicoin after your first completed booking.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">I want to...</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setRole('customer')} className={`p-4 border-2 rounded-2xl flex flex-col items-center transition-all ${role === 'customer' ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md scale-[1.02]' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                      <User className="h-8 w-8 mb-2" /><span className="font-semibold text-sm">Find services</span><span className="text-xs text-gray-500 mt-1">I'm a customer</span>
                    </button>
                    <button type="button" onClick={() => setRole('provider')} className={`p-4 border-2 rounded-2xl flex flex-col items-center transition-all ${role === 'provider' ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md scale-[1.02]' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                      <Briefcase className="h-8 w-8 mb-2" /><span className="font-semibold text-sm">Offer services</span><span className="text-xs text-gray-500 mt-1">I'm a provider</span>
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20">
                  <CheckCircle className="h-5 w-5" />Complete Sign Up
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUp() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <NimartSpinner size="lg" />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}