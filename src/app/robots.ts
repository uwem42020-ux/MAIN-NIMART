// src/app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/customer/',
          '/provider/dashboard/',
          '/provider/bookings/',
          '/provider/messages/',
          '/provider/payment/',
          '/provider/portfolio/',
          '/provider/profile/',
          '/provider/services/',
          '/provider/setup/',
          '/provider/verification/',
          '/auth/',
          '/book/',
          '/receipt/',
          '/notifications/',
          '/report/',
          '/search?',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://www.nimart.ng/sitemap.xml',
    host: 'https://www.nimart.ng',
  };
}