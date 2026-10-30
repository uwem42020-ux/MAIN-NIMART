// src/lib/upgradeProvider.ts
import { db } from '@/lib/supabase-any';

/**
 * Upgrade an existing user account to have provider capability.
 *
 * - Sets role = 'provider' (legacy, kept for old client compat)
 * - Sets is_provider = true (new source of truth)
 * - Sets signup_source = 'upgraded-from-dashboard' IF not already set
 *   (Google One Tap + direct signup flows don't carry attribution,
 *    so we record that they upgraded from a customer account)
 * - Does NOT touch is_complete (may be true from prior customer onboarding)
 * - Does NOT set provider_complete (that flips when they finish provider onboarding)
 *
 * Idempotent: no-op if the user is already a provider.
 */
export async function upgradeToProvider(
  userId: string,
  currentIsProvider: boolean,
  refreshProfile: () => Promise<void>,
): Promise<{ ok: boolean; error?: string }> {
  if (currentIsProvider) {
    return { ok: true };
  }

  // Preserve existing attribution — only set if null/empty.
  const { data: current } = await db
    .from('profiles')
    .select('signup_source')
    .eq('id', userId)
    .single();

  const updates: any = {
    role: 'provider',
    is_provider: true,
  };

  if (!(current as any)?.signup_source) {
    updates.signup_source = 'upgraded-from-dashboard';
    updates.signup_platform = 'web';
  }

  const { error } = await db
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    return { ok: false, error: error.message };
  }

  await refreshProfile();
  return { ok: true };
}