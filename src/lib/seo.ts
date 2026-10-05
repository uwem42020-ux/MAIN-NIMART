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
  // If true, bypasses the layout title template ("%s | Nimart").
  // Use when your page title ALREADY contains "Nimart" and would otherwise render
  // as e.g. "What is Nimart? | Nimart".
  absoluteTitle?: boolean;
}

export function buildMetadata({
  title,
  description,
  path,
  image = '/og-image.png',
  noindex = false,
  type = 'website',
  absoluteTitle = false,
}: BuildMetadataOptions): Metadata {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const canonical = `${BASE_URL}${normalizedPath}`;
  const imageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
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