import { db } from '@/lib/supabase-any';

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
  
  if (currentIndex >= levels.length - 1) return null;
  
  const nextBadge = levels[currentIndex + 1];
  return {
    badge: nextBadge,
    badgeLabel: BADGE_INFO[nextBadge].label,
    pointsNeeded: BADGE_THRESHOLDS[nextBadge] - score,
  };
}

export async function awardPoints(providerId: string, points: number, reason: string) {
  const { data: existing } = await db
    .from('provider_reputation_scores')
    .select('id, total_points')
    .eq('provider_id', providerId)
    .maybeSingle();

  if (!existing) {
    await db
      .from('provider_reputation_scores')
      .insert({
        provider_id: providerId,
        total_points: points,
        current_badge: getBadgeFromScore(points),
      } as any);
  } else {
    const existingScore = (existing as any).total_points || 0;
    const newScore = existingScore + points;
    const newBadge = getBadgeFromScore(newScore);
    const oldBadge = getBadgeFromScore(existingScore);

    await db
      .from('provider_reputation_scores')
      .update({
        total_points: newScore,
        current_badge: newBadge,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('provider_id', providerId);

    if (newBadge !== oldBadge) {
      await db.from('notifications').insert({
        user_id: providerId,
        type: 'system',
        title: `🏆 New Badge: ${BADGE_INFO[newBadge].label}!`,
        body: `Congratulations! You've earned the ${BADGE_INFO[newBadge].label} badge with ${newScore} points.`,
        data: { badge: newBadge, score: newScore },
      } as any);
    }
  }
}

export async function incrementStat(providerId: string, stat: 'completed_jobs' | 'positive_reviews' | 'repeat_customers' | 'fast_responses') {
  const { data: existing } = await db
    .from('provider_reputation_scores')
    .select(stat)
    .eq('provider_id', providerId)
    .maybeSingle();

  if (existing) {
    const currentValue = (existing as any)[stat] || 0;
    await db
      .from('provider_reputation_scores')
      .update({ [stat]: currentValue + 1, updated_at: new Date().toISOString() } as any)
      .eq('provider_id', providerId);
  }
}

export async function getProviderScore(providerId: string) {
  const { data } = await db
    .from('provider_reputation_scores')
    .select('*')
    .eq('provider_id', providerId)
    .maybeSingle();

  if (!data) return null;

  const score = (data as any).total_points || 0;
  return {
    ...data,
    badge: getBadgeFromScore(score),
    badgeInfo: BADGE_INFO[getBadgeFromScore(score)],
    nextBadge: getPointsToNextBadge(score),
  };
}

export async function addStrike(
  providerId: string,
  bookingId: string | null,
  reason: string,
  severity: 'minor' | 'moderate' | 'severe'
) {
  await db.from('provider_strikes').insert({
    provider_id: providerId,
    booking_id: bookingId,
    reason,
    severity,
  } as any);

  const { count } = await db
    .from('provider_strikes')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', providerId)
    .gt('expires_at', new Date().toISOString());

  const activeStrikes = count || 0;

  if (activeStrikes >= 7) {
    await db.from('profiles').update({
      is_banned: true,
      banned_reason: '7+ active strikes — permanently suspended',
      banned_at: new Date().toISOString(),
    } as any).eq('id', providerId);

    await db.from('notifications').insert({
      user_id: providerId,
      type: 'alert',
      title: '🚫 Account Permanently Suspended',
      body: 'Your account has been permanently suspended due to multiple unresolved violations.',
    } as any);
  } else if (activeStrikes >= 5) {
    await db.from('profiles').update({
      is_active: false,
      banned_reason: '5+ active strikes — 7-day suspension',
      banned_at: new Date().toISOString(),
    } as any).eq('id', providerId);

    await db.from('notifications').insert({
      user_id: providerId,
      type: 'alert',
      title: '⛔ Account Suspended (7 Days)',
      body: `You have ${activeStrikes} active strikes. Your account is suspended for 7 days. Strikes expire after 90 days.`,
    } as any);
  } else if (activeStrikes >= 3) {
    await db.from('notifications').insert({
      user_id: providerId,
      type: 'alert',
      title: '⚠️ Warning: Account at Risk',
      body: `You have ${activeStrikes} active strikes. After 5 strikes, your account will be suspended. After 7, permanent ban.`,
    } as any);
  }
}

export async function flagCustomer(customerId: string, bookingId: string, reason: string) {
  // Fetch current flag count
  const { data: profile } = await db
    .from('profiles')
    .select('customer_flag_count')
    .eq('id', customerId)
    .single();

  const currentCount = (profile as any)?.customer_flag_count || 0;

  await db
    .from('profiles')
    .update({ customer_flag_count: currentCount + 1 } as any)
    .eq('id', customerId);

  await db.from('booking_flags').insert({
    booking_id: bookingId,
    flagged_by: customerId,
    flag_type: 'customer_did_not_pay',
    description: reason,
  } as any);
}