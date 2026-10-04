// src/lib/seo.ts
import type { Metadata } from 'next';

const BASE_URL = 'https://www.nimart.ng';

interface BuildMetadataOptions {
  title: string;
  description: string;
  path: string;              // '/providers/lagos' — no trailing slash, no domain
  image?: string;            // '/og-image.png' or full URL
  noindex?: boolean;
  type?: 'website' | 'article' | 'profile';
}

export function buildMetadata({
  title,
  description,
  path,
  image = '/og-image.png',
  noindex = false,
  type = 'website',
}: BuildMetadataOptions): Metadata {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const canonical = `${BASE_URL}${normalizedPath}`;
  const imageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Nimart',
      type,
      locale: 'en_NG',
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}