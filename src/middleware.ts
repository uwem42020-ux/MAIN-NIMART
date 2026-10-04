// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const NOINDEX_PATTERNS: RegExp[] = [
  /^\/admin(\/|$)/,
  /^\/customer(\/|$)/,
  /^\/provider\/(dashboard|bookings|messages|payment|portfolio|profile|services|setup|verification)(\/|$)/,
  /^\/auth(\/|$)/,
  /^\/book(\/|$)/,
  /^\/receipt(\/|$)/,
  /^\/notifications(\/|$)/,
  /^\/report(\/|$)/,
  /^\/map(\/|$)/,
];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  if (NOINDEX_PATTERNS.some((re) => re.test(pathname))) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/customer/:path*',
    '/provider/:path*',
    '/auth/:path*',
    '/book/:path*',
    '/receipt/:path*',
    '/notifications/:path*',
    '/report/:path*',
    '/map/:path*',
  ],
};