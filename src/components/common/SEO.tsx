// src/components/common/SEO.tsx
'use client';

import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'profile' | 'article';
  schema?: object | object[];
  breadcrumbs?: { label: string; to?: string }[];
}

export function SEO({
  title = "Nimart - Nigeria's Trusted Service Marketplace",
  description = "Connect with verified professionals across Nigeria. Book trusted services for home, auto, beauty, and more.",
  keywords = "Nigerian services, find mechanic Nigeria, hire hairdresser, book electrician Lagos, service marketplace Nigeria, local services, Nimart",
  image = "/og-image.png",
  url = "https://nimart.ng",
  type = "website",
  schema,
  breadcrumbs,
}: SEOProps) {
  const fullTitle = title.includes('Nimart') ? title : `${title} | Nimart`;
  const imageUrl = image.startsWith('http') ? image : `https://nimart.ng${image}`;

  const schemas = schema
    ? Array.isArray(schema)
      ? schema
      : [schema]
    : [];

  if (breadcrumbs && breadcrumbs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.label,
        "item": item.to ? `https://nimart.ng${item.to}` : undefined,
      })),
    });
  }

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      <meta name="geo.region" content="NG" />
      <meta name="geo.placename" content="Nigeria" />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content="Nimart" />
      <meta property="og:locale" content="en_NG" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:site" content="@nimartng" />

      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Head>
  );
}