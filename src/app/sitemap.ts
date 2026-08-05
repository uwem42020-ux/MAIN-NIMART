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

  // Only service pages with actual providers — get providers then join profiles separately
  const { data: activeProviders } = await db
    .from('providers')
    .select('id, selected_category_slug')
    .eq('is_available', true)
    .not('selected_category_slug', 'is', null);

  if (activeProviders && (activeProviders as any[]).length > 0) {
    const providerIds = (activeProviders as any[]).map((p: any) => p.id);

    const { data: profiles } = await db
      .from('profiles')
      .select('id, lga_id')
      .in('id', providerIds)
      .not('lga_id', 'is', null);

    const profileMap = new Map((profiles as any[])?.map((p: any) => [p.id, p.lga_id]) || []);

    const seen = new Set<string>();
    const serviceLocationUrls: MetadataRoute.Sitemap[number][] = [];

    (activeProviders as any[]).forEach((p: any) => {
      const lgaId = profileMap.get(p.id);
      if (!lgaId) return;
      const key = `${p.selected_category_slug}||${lgaId}`;
      if (!seen.has(key)) {
        seen.add(key);
        serviceLocationUrls.push({
          url: `${BASE_URL}/services/${p.selected_category_slug}/in/${lgaId}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.5,
        });
      }
    });

    return [...staticPages, ...providerUrls, ...blogUrls, ...tierUrls, ...serviceLocationUrls];
  }

  return [...staticPages, ...providerUrls, ...blogUrls, ...tierUrls];
}