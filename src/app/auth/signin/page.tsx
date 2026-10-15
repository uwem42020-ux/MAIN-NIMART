// src/app/auth/signin/page.tsx
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { SignInClient } from './SignInClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Safe-path check for ?next= — blocks open redirects (e.g. ?next=https://evil.com)
function isSafeNext(next: string | undefined): next is string {
  return !!next && next.startsWith('/') && !next.startsWith('//');
}

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Already logged in — send them where they meant to go, or to their dashboard.
    if (isSafeNext(next)) {
      redirect(next);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_provider, provider_complete, is_complete')
      .eq('id', user.id)
      .single();

    // Capability-based routing with role fallback.
    const isProviderFlag =
      (profile as any)?.is_provider ?? profile?.role === 'provider';

    // Onboarding status: both flags count. Use || (not ??) because
    // provider_complete is NOT NULL DEFAULT false — never nullish — so the
    // ?? chain would short-circuit on it and is_complete would be dead code.
    const providerComplete =
      (profile as any)?.provider_complete === true ||
      (profile as any)?.is_complete === true;

    if (isProviderFlag) {
      redirect(providerComplete ? '/provider/dashboard' : '/provider/setup');
    }
    redirect('/customer/dashboard');
  }

  return <SignInClient next={next} />;
}