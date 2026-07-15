// app/page.tsx
import { HomeClient } from './HomeClient';
import { fetchInitialProviders } from '@/lib/serverQueries';
import type { Metadata } from 'next';

// Static server‑side metadata (perfect for sitelinks and rich results)
export const metadata: Metadata = {
  title: "Nimart – Nigeria's Trusted Service Marketplace",
  description:
    'Connect with verified professionals across Nigeria. Book trusted services for home, auto, beauty, and more.',
  openGraph: {
    title: "Nimart – Nigeria's Trusted Service Marketplace",
    description:
      'Connect with verified professionals across Nigeria. Book trusted services for home, auto, beauty, and more.',
    url: 'https://nimart.ng',
    siteName: 'Nimart',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Nimart – Nigeria's Trusted Service Marketplace",
    description:
      'Connect with verified professionals across Nigeria. Book trusted services for home, auto, beauty, and more.',
    images: ['/og-image.png'],
  },
};

// JSON‑LD for rich results (Organization + WebSite) – inlined in the HTML
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Nimart',
      url: 'https://nimart.ng',
      logo: 'https://nimart.ng/logo.png',
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
      url: 'https://nimart.ng',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://nimart.ng/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default async function HomePage() {
  const initialProviders = await fetchInitialProviders();

  return (
    <>
      {/* Inject JSON‑LD – no client‑side component needed */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient initialProviders={initialProviders} />
    </>
  );
}