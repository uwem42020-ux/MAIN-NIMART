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

    const testEmail = 'your-actual-email@example.com';
    
    const { data, error } = await supabaseAdmin.auth.signInWithOtp({
      email: testEmail,
      options: { shouldCreateUser: true },
    });

    return NextResponse.json({
      success: !error,
      errorMessage: error?.message,
      errorCode: error?.code,
      errorStatus: error?.status,
      hasData: !!data,
    });

  } catch (err) {
    return NextResponse.json({
      error: String(err),
    }, { status: 500 });
  }
}