// src/app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // ⚠️ ONLY disallow what should NEVER be crawled.
        //
        // Private pages (/admin, /auth, /customer, /provider/dashboard, /search?, etc.)
        // rely on middleware `X-Robots-Tag: noindex` INSTEAD.
        //
        // If we disallow them here, Google cannot crawl them to see the noindex
        // header — and any page already indexed would stay indexed forever.
        //
        // /api/ is safe to disallow because API routes never returned HTML,
        // so Google never indexed them. No trap possible.
        disallow: [
          '/api/',
        ],
      },
    ],
    sitemap: 'https://www.nimart.ng/sitemap.xml',
    host: 'https://www.nimart.ng',
  };
}