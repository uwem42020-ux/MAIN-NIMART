// src/app/api/auth/send-otp/route.ts (with logging)
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, turnstileToken } = await request.json();

    if (!email || !turnstileToken) {
      return NextResponse.json({ error: 'Email and verification required' }, { status: 400 });
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.error('TURNSTILE_SECRET_KEY missing');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const turnstileResult = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: secretKey, response: turnstileToken }),
    });

    const turnstileData = await turnstileResult.json();
    console.log('Turnstile response:', turnstileData);

    if (!turnstileData.success) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error) {
      console.error('Supabase OTP error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}