import { supabase } from './supabase';

export async function generateUniqueReferralCode(name: string): Promise<string> {
  const base = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  let code = `${base}${random}`;

  // Ensure uniqueness
  while (true) {
    const { count } = await supabase
      .from('providers')
      .select('*', { count: 'exact', head: true })
      .eq('referral_code', code);
    if (count === 0) break;
    code = `${base}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }
  return code;
}