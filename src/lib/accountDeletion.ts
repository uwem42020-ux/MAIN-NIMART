// src/lib/accountDeletion.ts
import { db } from '@/lib/supabase-any';

/**
 * Request deletion of the current user's account.
 *
 * Writes a marker notification that admins process within 48 hours.
 * The client then signs the user out. Real deletion of the auth user
 * and all associated rows happens server-side.
 *
 * Mirrors nimart-shared/src/lib/accountDeletion.ts — keep both in sync.
 */
export async function requestAccountDeletion(
  userId: string,
  reason?: string
): Promise<boolean> {
  try {
    const { error } = await db.from('notifications').insert({
      user_id: userId,
      type: 'account_deletion_request',
      title: 'Account deletion requested',
      body: reason?.trim()
        ? `Reason: ${reason.trim()}`
        : 'No reason provided.',
      data: {
        requested_at: new Date().toISOString(),
        user_id: userId,
      },
      is_read: false,
    });

    if (error) {
      console.warn('Account deletion request failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Account deletion exception:', err);
    return false;
  }
}