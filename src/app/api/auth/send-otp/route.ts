// src/app/api/auth/send-otp/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, turnstileToken } = await request.json();

    // 1. Verify Turnstile
    const turnstileResult = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      }),
    });
    const turnstileData = await turnstileResult.json();
    if (!turnstileData.success) {
      return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 400 });
    }

    // 2. Generate 8-digit OTP
    const otp = Math.floor(10000000 + Math.random() * 90000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // 3. Store OTP in Supabase
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { error: insertError } = await supabaseAdmin
      .from('signup_otps')
      .upsert({
        email,
        otp,
        expires_at: expiresAt,
      }, { onConflict: 'email' });

    if (insertError) {
      return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 });
    }

    // 4. Send OTP via send-email Edge Function
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Nimart Verification Code</title>
      </head>
      <body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <tr>
                  <td style="background-color: #008751; padding: 32px 40px 24px; border-radius: 16px 16px 0 0; text-align: center;">
                    <h2 style="color: #ffffff; font-size: 20px; margin: 0;">Welcome to Nimart</h2>
                    <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0;">Nigeria's trusted service marketplace</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #1a1a1a; font-size: 22px; font-weight: 600; margin: 0 0 12px;">Verify your email</h2>
                    <p style="color: #555555; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
                      Use the code below to sign in or create your account. This code expires in 10 minutes.
                    </p>
                    <div style="background-color: #f0fdf4; border: 2px dashed #008751; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
                      <span style="font-family: 'Courier New', monospace; font-size: 42px; font-weight: 700; letter-spacing: 6px; color: #008751;">${otp}</span>
                    </div>
                    <p style="color: #555555; font-size: 14px; line-height: 1.5; margin: 0 0 24px;">
                      If you didn't request this code, you can safely ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0 24px;">
                    <p style="color: #888888; font-size: 12px; text-align: center; margin: 0;">
                      &copy; Nimart. All rights reserved.<br>Lagos, Nigeria
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const emailRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          to: email,
          subject: 'Your Nimart Verification Code',
          html: emailBody,
        }),
      }
    );

    if (!emailRes.ok) {
      // Clean up OTP if email fails
      await supabaseAdmin.from('signup_otps').delete().eq('email', email);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}