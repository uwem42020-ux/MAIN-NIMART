// src/app/blog/page.tsx
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { BlogClient } from './BlogClient';

export const metadata: Metadata = buildMetadata({
  title: 'Nimart Blog - Tips & Guides for Nigerian Services',
  description:
    'Read the Nimart blog for tips on hiring trusted professionals, home services, auto repair, beauty, and more.',
  path: '/blog',
});

const blogListSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Nimart Blog',
  description:
    'Tips, guides, and stories about finding trusted services in Nigeria.',
  url: 'https://www.nimart.ng/blog',
  publisher: {
    '@type': 'Organization',
    name: 'Nimart',
    url: 'https://www.nimart.ng',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.nimart.ng/logo.png',
    },
  },
};

export default function BlogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }}
      />
      <BlogClient />
    </>
  );
}