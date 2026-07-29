// src/app/api/auth/test-otp/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({
        error: 'Missing env vars',
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceKey
      }, { status: 500 });
    }

    const projectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1] || 'unknown';

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    const testEmail = 'your-actual-email@example.com';
    
    const { data, error } = await supabaseAdmin.auth.signInWithOtp({
      email: testEmail,
      options: { shouldCreateUser: false },
    });

    return NextResponse.json({
      success: !error,
      error: error ? JSON.stringify(error) : null,
      errorMessage: error?.message,
      errorStatus: error?.status,
      hasData: !!data,
      projectRef,
      urlUsed: supabaseUrl,
      keyPrefix: serviceKey.substring(0, 15) + '...',
    });

  } catch (err) {
    return NextResponse.json({
      error: 'Exception caught',
      message: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}