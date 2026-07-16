// src/app/auth/signup/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { User, Briefcase, Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import { requestPushPermission } from '@/lib/pushNotifications';
import { REFERRAL_BONUS } from '@/lib/nicoinConfig';
import Turnstile from 'react-turnstile';

type Step = 'email' | 'otp' | 'profile';

export default function SignUp() {
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
  const [otpCooldown, setOtpCooldown] = useState(false);

  // Honeypot state
  const [honeypot, setHoneypot] = useState('');
  // Turnstile token
  const [turnstileToken, setTurnstileToken] = useState('');

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

    // Honeypot check
    if (honeypot) {
      toast.error('Spam detected');
      return;
    }

    if (!turnstileToken) {
      toast.error('Please complete the security check');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      toast.success('An 8‑digit code has been sent to your email');
      scrollToTop();
      setStep('otp');
      setOtpCooldown(true);
      setTimeout(() => setOtpCooldown(false), 30000);
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
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
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
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: existingProfile } = await db
        .from('profiles').select('role').eq('id', user.id).single();
      if (existingProfile?.role) {
        await supabase.auth.signOut();
        router.push('/auth/signin');
        scrollToTop();
        toast.error(`This email is already registered as a ${existingProfile.role}. Please sign in.`);
        return;
      }

      if (role === 'provider' && referralCode.trim()) {
        const { data: referrer } = await db
          .from('providers').select('id').eq('referral_code', referralCode.trim().toUpperCase()).single();
        if (!referrer) {
          scrollToTop();
          toast.error('Referral code not found.');
          setLoading(false);
          return;
        }
        if (referrer.id === user.id) {
          scrollToTop();
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
        scrollToTop();
        await requestPushPermission(user.id);
        router.push('/customer/dashboard');
        return;
      }

      await db.from('profiles').update({ full_name: fullName, role, is_complete: false }).eq('id', user.id);
      await refreshProfile();
      toast.success('Account created! Please complete your business profile.');
      scrollToTop();
      await requestPushPermission(user.id);
      router.push('/provider/setup');
    } catch (error: any) {
      scrollToTop();
      toast.error(error.message || 'Failed to complete signup');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    } catch (error: any) {
      scrollToTop();
      toast.error(error.message);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    } catch (error: any) {
      scrollToTop();
      toast.error(error.message);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <NimartSpinner size="lg" />
      </div>
    );

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
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
            {step === 'email' && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Create your account</h2>
                <p className="text-sm text-gray-500 text-center mb-6">Join Nigeria's trusted service marketplace</p>

                <div className="relative mb-4">
                  <button
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-primary-500 text-gray-700 py-3 rounded-xl hover:bg-primary-50 transition font-medium shadow-md"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </button>
                  <span className="absolute -top-2 right-4 bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">RECOMMENDED</span>
                </div>

                <button
                  onClick={handleFacebookSignIn}
                  className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white py-3 rounded-xl hover:bg-[#166fe5] transition font-medium shadow-sm mb-4"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continue with Facebook
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                  <div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-gray-400 font-medium">or sign up with email</span></div>
                </div>

                <form onSubmit={sendOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><input ref={emailInputRef} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition" placeholder="you@example.com" /></div>
                  </div>

                  <input
                    type="text"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    style={{ position: 'absolute', left: '-9999px' }}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                  />

                  <div className="flex justify-center">
                    <Turnstile
                      sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                      onVerify={(token) => setTurnstileToken(token)}
                      theme="light"
                    />
                  </div>

                  <button type="submit" disabled={loading || otpCooldown} className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition font-semibold shadow-lg shadow-primary-600/20">
                    {otpCooldown ? 'Please wait 30 seconds' : 'Continue with Email'}
                  </button>
                </form>

                <p className="mt-6 text-sm text-center text-gray-500">Already have an account? <Link href="/auth/signin" className="text-primary-600 hover:underline font-semibold">Sign in</Link></p>
              </>
            )}

            {step === 'otp' && (
              <form onSubmit={verifyOTP} className="space-y-5">
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Check your email</h2>
                <p className="text-sm text-gray-500 text-center mb-6">We sent an 8‑digit code to <span className="font-medium text-gray-700">{email}</span></p>
                <div><input ref={otpInputRef} type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-2xl tracking-[0.3em] font-mono font-bold" placeholder="00000000" maxLength={8} /></div>
                <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition font-semibold shadow-lg shadow-primary-600/20">Verify & Continue</button>
                <button type="button" onClick={() => setStep('email')} className="w-full flex items-center justify-center gap-1 text-sm text-primary-600 hover:underline font-medium"><ArrowLeft className="h-4 w-4" />Back to email</button>
              </form>
            )}

            {step === 'profile' && (
              <form onSubmit={completeProfile} className="space-y-5">
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Complete your profile</h2>
                <p className="text-sm text-gray-500 text-center mb-6">Just a few more details</p>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><input ref={nameInputRef} type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition" placeholder="John Doe" /></div></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Referral Code (optional)</label><div className="relative"><input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition" placeholder="Enter referral code" maxLength={12} /></div><p className="text-xs text-gray-500 mt-1">If someone invited you, enter their code. Both of you will earn {REFERRAL_BONUS} Nicoin after your first completed booking.</p></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-3">I want to...</label><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setRole('customer')} className={`p-4 border-2 rounded-2xl flex flex-col items-center transition-all ${role === 'customer' ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md scale-[1.02]' : 'border-gray-200 bg-white hover:border-gray-300'}`}><User className="h-8 w-8 mb-2" /><span className="font-semibold text-sm">Find services</span><span className="text-xs text-gray-500 mt-1">I'm a customer</span></button><button type="button" onClick={() => setRole('provider')} className={`p-4 border-2 rounded-2xl flex flex-col items-center transition-all ${role === 'provider' ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md scale-[1.02]' : 'border-gray-200 bg-white hover:border-gray-300'}`}><Briefcase className="h-8 w-8 mb-2" /><span className="font-semibold text-sm">Offer services</span><span className="text-xs text-gray-500 mt-1">I'm a provider</span></button></div></div>
                <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"><CheckCircle className="h-5 w-5" />Complete Sign Up</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}