// src/lib/upgradeProvider.ts
import { db } from '@/lib/supabase-any';

/**
 * Upgrade an existing user account to have provider capability.
 *
 * - Sets role = 'provider' (legacy, kept for old client compat)
 * - Sets is_provider = true (new source of truth)
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

  const { error } = await db
    .from('profiles')
    .update({ role: 'provider', is_provider: true })
    .eq('id', userId);

  if (error) {
    return { ok: false, error: error.message };
  }

  await refreshProfile();
  return { ok: true };
}