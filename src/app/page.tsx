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

            {/* The Logo inside a perfect round circle (Inline SVG - Zero Delay) */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full shadow-sm mb-6 flex items-center justify-center bg-[#008751] overflow-hidden">
              <svg
                viewBox="0 0 1706.66 1706.66"
                className="w-16 h-16 sm:w-20 sm:h-20"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Your Custom N - Drawn purely with vector points */}
                <polygon points="950.67,424.94 827.27,259.15 1295.95,259.15 1295.95,1447.51 831.64,1088.61 831.64,876.46 1089.2,1068.96 1089.2,424.94 " />
                <polygon points="582.8,612.76 838.19,822.31 844.73,604.16 390.71,259.15 390.71,1440.83 841.16,1440.83 711.21,1278.51 584.98,1278.51 " />
              </svg>
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