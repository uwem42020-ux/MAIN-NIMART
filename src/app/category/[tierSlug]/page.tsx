// src/app/category/[tierSlug]/page.tsx
import { Metadata } from 'next';
import { TIERS } from '@/data/categories';
import { TierPageClient } from './TierPageClient';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ tierSlug: string }> }): Promise<Metadata> {
  const { tierSlug } = await params;
  const tier = TIERS.find(t => t.slug === tierSlug);

  if (!tier) {
    return {
      title: 'Category Not Found',
      description: "The service category you're looking for doesn't exist.",
      robots: { index: false, follow: false },
    };
  }

  return buildMetadata({
    title: `${tier.name} Services in Nigeria – Find Trusted Professionals`,
    description: `Browse verified ${tier.name.toLowerCase()} professionals across Nigeria. Compare profiles, read reviews, and book trusted ${tier.name.toLowerCase()} services on Nimart.`,
    path: `/category/${tierSlug}`,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ tierSlug: string }> }) {
  const { tierSlug } = await params;

  return <TierPageClient tierSlug={tierSlug} />;
}