import { supabase } from './supabase';

export type BadgeLevel = 
  | 'newcomer' 
  | 'rising' 
  | 'trusted' 
  | 'elite' 
  | 'premium' 
  | 'master' 
  | 'legendary';

export const BADGE_THRESHOLDS: Record<BadgeLevel, number> = {
  newcomer: 0,
  rising: 50,
  trusted: 200,
  elite: 500,
  premium: 1000,
  master: 2500,
  legendary: 5000,
};

export const BADGE_INFO: Record<BadgeLevel, { label: string; emoji: string; color: string; bgColor: string }> = {
  newcomer: { label: 'Newcomer', emoji: '🆕', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  rising: { label: 'Rising Provider', emoji: '🔵', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  trusted: { label: 'Trusted Provider', emoji: '🟡', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  elite: { label: 'Elite Provider', emoji: '🟢', color: 'text-green-600', bgColor: 'bg-green-50' },
  premium: { label: 'Premium Provider', emoji: '🟣', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  master: { label: 'Master Provider', emoji: '🟠', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  legendary: { label: 'Legendary Provider', emoji: '👑', color: 'text-amber-600', bgColor: 'bg-amber-50' },
};

export function getBadgeFromScore(score: number): BadgeLevel {
  if (score >= BADGE_THRESHOLDS.legendary) return 'legendary';
  if (score >= BADGE_THRESHOLDS.master) return 'master';
  if (score >= BADGE_THRESHOLDS.premium) return 'premium';
  if (score >= BADGE_THRESHOLDS.elite) return 'elite';
  if (score >= BADGE_THRESHOLDS.trusted) return 'trusted';
  if (score >= BADGE_THRESHOLDS.rising) return 'rising';
  return 'newcomer';
}

export function getPointsToNextBadge(score: number): { badge: BadgeLevel; badgeLabel: string; pointsNeeded: number } | null {
  const levels: BadgeLevel[] = ['newcomer', 'rising', 'trusted', 'elite', 'premium', 'master', 'legendary'];
  const currentBadge = getBadgeFromScore(score);
  const currentIndex = levels.indexOf(currentBadge);
  
  if (currentIndex >= levels.length - 1) return null; // Already at max
  
  const nextBadge = levels[currentIndex + 1];
  return {
    badge: nextBadge,
    badgeLabel: BADGE_INFO[nextBadge].label,
    pointsNeeded: BADGE_THRESHOLDS[nextBadge] - score,
  };
}

export async function awardPoints(providerId: string, points: number, reason: string) {
  // Ensure score row exists
  const { data: existing } = await supabase
    .from('provider_reputation_scores')
    .select('id, total_points')
    .eq('provider_id', providerId)
    .maybeSingle();

  if (!existing) {
    await supabase
      .from('provider_reputation_scores')
      .insert({
        provider_id: providerId,
        total_points: points,
        current_badge: getBadgeFromScore(points),
      });
  } else {
    const newScore = existing.total_points + points;
    const newBadge = getBadgeFromScore(newScore);
    const oldBadge = getBadgeFromScore(existing.total_points);

    await supabase
      .from('provider_reputation_scores')
      .update({
        total_points: newScore,
        current_badge: newBadge,
        updated_at: new Date().toISOString(),
      })
      .eq('provider_id', providerId);

    // Notify if badge changed
    if (newBadge !== oldBadge) {
      await supabase.from('notifications').insert({
        user_id: providerId,
        type: 'system',
        title: `🏆 New Badge: ${BADGE_INFO[newBadge].label}!`,
        body: `Congratulations! You've earned the ${BADGE_INFO[newBadge].label} badge with ${newScore} points.`,
        data: { badge: newBadge, score: newScore },
      });
    }
  }
}

export async function incrementStat(providerId: string, stat: 'completed_jobs' | 'positive_reviews' | 'repeat_customers' | 'fast_responses') {
  const { data: existing } = await supabase
    .from('provider_reputation_scores')
    .select(stat)
    .eq('provider_id', providerId)
    .maybeSingle();

  if (existing) {
    const currentValue = existing[stat] || 0;
    await supabase
      .from('provider_reputation_scores')
      .update({ [stat]: currentValue + 1, updated_at: new Date().toISOString() })
      .eq('provider_id', providerId);
  }
}

export async function getProviderScore(providerId: string) {
  const { data } = await supabase
    .from('provider_reputation_scores')
    .select('*')
    .eq('provider_id', providerId)
    .maybeSingle();

  if (!data) return null;

  return {
    ...data,
    badge: getBadgeFromScore(data.total_points),
    badgeInfo: BADGE_INFO[getBadgeFromScore(data.total_points)],
    nextBadge: getPointsToNextBadge(data.total_points),
  };
}

export async function addStrike(
  providerId: string,
  bookingId: string | null,
  reason: string,
  severity: 'minor' | 'moderate' | 'severe'
) {
  await supabase.from('provider_strikes').insert({
    provider_id: providerId,
    booking_id: bookingId,
    reason,
    severity,
  });

  // Check active strikes
  const { count } = await supabase
    .from('provider_strikes')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', providerId)
    .gt('expires_at', new Date().toISOString());

  const activeStrikes = count || 0;

  if (activeStrikes >= 7) {
    // Permanent suspension
    await supabase.from('profiles').update({
      is_banned: true,
      banned_reason: '7+ active strikes — permanently suspended',
      banned_at: new Date().toISOString(),
    }).eq('id', providerId);

    await supabase.from('notifications').insert({
      user_id: providerId,
      type: 'alert',
      title: '🚫 Account Permanently Suspended',
      body: 'Your account has been permanently suspended due to multiple unresolved violations.',
    });
  } else if (activeStrikes >= 5) {
    // 7-day suspension
    await supabase.from('profiles').update({
      is_active: false,
      banned_reason: '5+ active strikes — 7-day suspension',
      banned_at: new Date().toISOString(),
    }).eq('id', providerId);

    await supabase.from('notifications').insert({
      user_id: providerId,
      type: 'alert',
      title: '⛔ Account Suspended (7 Days)',
      body: `You have ${activeStrikes} active strikes. Your account is suspended for 7 days. Strikes expire after 90 days.`,
    });
  } else if (activeStrikes >= 3) {
    // Warning
    await supabase.from('notifications').insert({
      user_id: providerId,
      type: 'alert',
      title: '⚠️ Warning: Account at Risk',
      body: `You have ${activeStrikes} active strikes. After 5 strikes, your account will be suspended. After 7, permanent ban.`,
    });
  }
}

export async function flagCustomer(customerId: string, bookingId: string, reason: string) {
  await supabase
    .from('profiles')
    .update({ customer_flag_count: supabase.raw('COALESCE(customer_flag_count, 0) + 1') })
    .eq('id', customerId);

  await supabase.from('booking_flags').insert({
    booking_id: bookingId,
    flagged_by: customerId,
    flag_type: 'customer_did_not_pay',
    description: reason,
  });
}