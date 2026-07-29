// src/app/api/auth/test-otp/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabaseAdmin = createClient(supabaseUrl!, serviceKey!, {
      auth: { persistSession: false }
    });

    // Test 1: Basic connection - get server time
    const { data: healthData, error: healthError } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1);
    
    // Test 2: Try OTP
    const testEmail = 'your-actual-email@example.com';
    const { data, error } = await supabaseAdmin.auth.signInWithOtp({
      email: testEmail,
      options: { shouldCreateUser: true },
    });

    return NextResponse.json({
      dbConnected: !healthError,
      dbError: healthError?.message || null,
      otpSuccess: !error,
      otpErrorMessage: error?.message,
      otpErrorCode: error?.code,
      otpErrorStatus: error?.status,
      fullError: error ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : null,
      hasData: !!data,
    });

  } catch (err) {
    return NextResponse.json({
      error: String(err),
    }, { status: 500 });
  }
}