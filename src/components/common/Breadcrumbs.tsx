// src/components/common/Breadcrumbs.tsx
'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface Crumb {
  label: string;
  to?: string;   // if omitted, it's the current page (not a link)
}

interface BreadcrumbsProps {
  items: Crumb[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  // Build JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": item.to ? `https://nimart.ng${item.to}` : undefined,
    })),
  };

  return (
    <>
      {/* Structured data (invisible) */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>

      {/* Visible breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
          {items.map((crumb, idx) => (
            <li key={idx} className="flex items-center gap-1">
              {idx === 0 ? (
                <Link href={crumb.to || '/'} className="hover:text-primary-600 transition-colors flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" />
                  {crumb.label}
                </Link>
              ) : crumb.to ? (
                <Link href={crumb.to} className="hover:text-primary-600 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-700 font-medium truncate max-w-[200px]">
                  {crumb.label}
                </span>
              )}
              {idx < items.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}