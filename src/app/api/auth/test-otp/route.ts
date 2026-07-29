import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Check if env vars exist first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({
        error: 'Missing env vars',
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceKey,
        keyPrefix: serviceKey ? serviceKey.substring(0, 15) + '...' : 'missing'
      }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    // Replace with YOUR email for testing
    const testEmail = 'uwem42020@gmail.com';
    
    const { data, error } = await supabaseAdmin.auth.signInWithOtp({
      email: testEmail,
      options: { shouldCreateUser: true },
    });

    return NextResponse.json({
      success: !error,
      error: error ? error.message : null,
      errorDetails: error ? JSON.stringify(error) : null,
      hasData: !!data
    });

  } catch (err) {
    return NextResponse.json({
      error: 'Exception caught',
      message: err instanceof Error ? err.message : String(err),
      type: typeof err
    }, { status: 500 });
  }
}