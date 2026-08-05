// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { db } from '@/lib/supabase-any';
import { TIERS } from '@/data/categories';

const BASE_URL = 'https://nimart.ng';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages = [
    { url: `${BASE_URL}/`, priority: 1, changeFrequency: 'daily' as const },
    { url: `${BASE_URL}/search`, priority: 0.9, changeFrequency: 'daily' as const },
    { url: `${BASE_URL}/blog`, priority: 0.9, changeFrequency: 'daily' as const },
    { url: `${BASE_URL}/careers`, priority: 0.5, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/auth/signup`, priority: 0.8, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/auth/signin`, priority: 0.7, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/help`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/safety`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/terms`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${BASE_URL}/privacy`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${BASE_URL}/cookies`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${BASE_URL}/report`, priority: 0.4, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/nimart-explained`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/about`, priority: 0.7, changeFrequency: 'monthly' as const },
  ];

  // Provider pages
  const { data: providers } = await db
    .from('providers')
    .select('id, updated_at')
    .eq('is_available', true);

  const providerUrls = ((providers || []) as any[]).map((p) => ({
    url: `${BASE_URL}/provider/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Blog posts
  const { data: blogPosts } = await db
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('published', true);

  const blogUrls = ((blogPosts || []) as any[]).map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Tier pages
  const tierUrls = TIERS.map((tier) => ({
    url: `${BASE_URL}/category/${tier.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Only service pages with actual providers
  const { data: activeCombos } = await db
    .from('providers')
    .select('selected_category_slug, profiles!inner(lga_id)')
    .eq('is_available', true)
    .not('selected_category_slug', 'is', null)
    .not('profiles.lga_id', 'is', null);

  const seen = new Set<string>();
  const serviceLocationUrls: MetadataRoute.Sitemap[number][] = [];

  ((activeCombos || []) as any[]).forEach((p: any) => {
    const key = `${p.selected_category_slug}||${p.profiles?.lga_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      serviceLocationUrls.push({
        url: `${BASE_URL}/services/${p.selected_category_slug}/in/${p.profiles.lga_id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      });
    }
  });

  return [...staticPages, ...providerUrls, ...blogUrls, ...tierUrls, ...serviceLocationUrls];
}