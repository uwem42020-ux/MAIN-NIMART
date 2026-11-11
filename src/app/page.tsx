// src/app/page.tsx
import { Suspense } from 'react';
import { HomeClient } from './HomeClient';
import { fetchInitialProviders, fetchTopProviders } from '@/lib/serverQueries';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: "Nimart - Nigeria's Trusted Service Marketplace",
  description:
    'Connect with verified professionals across Nigeria. Book trusted services for home, auto, beauty, and more.',
  path: '/',
});

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Nimart',
      url: 'https://www.nimart.ng',
      logo: 'https://www.nimart.ng/logo.png',
      description:
        "Nigeria's trusted marketplace connecting customers with verified service professionals.",
      sameAs: [
        'https://www.instagram.com/nimartng',
        'https://www.tiktok.com/@nimart.ng',
        'https://web.facebook.com/people/Nimart/61551209078955/',
        'https://x.com/nimartng',
        'https://www.youtube.com/@Nimartng',
      ],
    },
    {
      '@type': 'WebSite',
      name: 'Nimart',
      url: 'https://www.nimart.ng',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://www.nimart.ng/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default async function HomePage() {
  const initialProviders = await fetchInitialProviders();
  const initialTopProviders = await fetchTopProviders();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen flex flex-col items-center justify-center bg-white fixed inset-0 z-50">
            {/* The CSS Animation for the sliding line */}
            <style>{`
              @keyframes sliding-line {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(300%); }
              }
              .animate-sliding-line {
                animation: sliding-line 1.5s infinite ease-in-out;
              }
            `}</style>

            {/* The Logo - Clean, borderless, soft shadow */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full shadow-sm mb-6 flex items-center justify-center">
              <img
                src="/loadhome.png"
                alt="Nimart"
                className="w-full h-full object-contain"
              />
            </div>

            {/* The Loading Line (Gmail Style) */}
            <div className="w-40 sm:w-48 h-1 bg-gray-100 rounded-full overflow-hidden relative">
              <div className="absolute top-0 left-0 h-full w-1/3 bg-[#008751] rounded-full animate-sliding-line" />
            </div>
          </div>
        }
      >
        <HomeClient
          initialProviders={initialProviders}
          initialTopProviders={initialTopProviders}
        />
      </Suspense>
    </>
  );
}