// src/app/api/auth/verify-otp/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabaseAdmin
      .from('signup_otps')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    if (new Date(data.expires_at) < new Date()) {
      await supabaseAdmin.from('signup_otps').delete().eq('email', email);
      return NextResponse.json({ error: 'Code has expired' }, { status: 400 });
    }

    await supabaseAdmin.from('signup_otps').delete().eq('email', email);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}