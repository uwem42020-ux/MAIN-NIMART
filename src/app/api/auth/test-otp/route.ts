// src/app/api/auth/test-otp/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const testEmail = 'uwem42020@gmail.com';
    
    // Direct API call to Supabase auth endpoint
    const response = await fetch(`${supabaseUrl}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey!,
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({
        email: testEmail,
        create_user: true
      })
    });

    const responseData = await response.json();

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      responseData,
    });

  } catch (err) {
    return NextResponse.json({
      error: String(err),
    }, { status: 500 });
  }
}