// src/app/auth/signin/page.tsx
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { SignInClient } from './SignInClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function SignIn() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Already logged in — send them to their dashboard
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;
    if (role === 'admin') redirect('/admin/dashboard');
    if (role === 'provider') redirect('/provider/dashboard');
    if (role === 'customer') redirect('/customer/dashboard');
    redirect('/');
  }

  return <SignInClient />;
}