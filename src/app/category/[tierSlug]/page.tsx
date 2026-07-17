// src/app/category/[tierSlug]/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { TIERS, CATEGORIES, SUBCATEGORIES } from '@/data/categories';
import { TierPageClient } from './TierPageClient';

const tierIconMap: Record<string, string> = {
  automotive: '/categoryicons/roadside.png',
  'home-property': '/categoryicons/home.png',
  emergency: '/categoryicons/safety.png',
  professional: '/categoryicons/services.png',
  technology: '/categoryicons/technology.png',
  beauty: '/categoryicons/beauty.png',
  food: '/categoryicons/food.png',
  events: '/categoryicons/event.png',
  education: '/categoryicons/education.png',
  health: '/categoryicons/health.png',
  logistics: '/categoryicons/logistics.png',
  social: '/categoryicons/social.png',
  'business-partners': '/categoryicons/partner&support.png',
  trade: '/categoryicons/export.png',
};

export async function generateMetadata({ params }: { params: Promise<{ tierSlug: string }> }): Promise<Metadata> {
  const { tierSlug } = await params;
  const tier = TIERS.find(t => t.slug === tierSlug);
  
  if (!tier) {
    return {
      title: 'Category Not Found | Nimart',
      description: 'The service category you\'re looking for doesn\'t exist.',
    };
  }

  const title = `${tier.name} Services in Nigeria – Find Trusted Professionals | Nimart`;
  const description = `Browse verified ${tier.name.toLowerCase()} professionals across Nigeria. Compare profiles, read reviews, and book trusted ${tier.name.toLowerCase()} services on Nimart.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://nimart.ng/category/${tierSlug}`,
      siteName: 'Nimart',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ tierSlug: string }> }) {
  const { tierSlug } = await params;
  
  return <TierPageClient tierSlug={tierSlug} />;
}