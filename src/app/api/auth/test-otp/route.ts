// src/app/api/auth/test-otp/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Nimart <info@nimart.ng>',
        to: 'uwem42020@gmail.com',
        subject: 'Test from Vercel',
        html: '<p>If you see this, Resend API key works!</p>',
      }),
    });

    const data = await response.json();

    return NextResponse.json({
      resendStatus: response.status,
      resendResponse: data,
      keyUsed: apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING',
    });

  } catch (err) {
    return NextResponse.json({
      error: String(err),
    }, { status: 500 });
  }
}