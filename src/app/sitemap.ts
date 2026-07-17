// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { supabaseServer } from '@/lib/supabase-server';

const BASE_URL = 'https://nimart.ng';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
  const { data: providers } = await supabaseServer
    .from('providers')
    .select('id, updated_at')
    .eq('is_available', true);

  const providerUrls = (providers || []).map((p) => ({
    url: `${BASE_URL}/provider/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Blog posts
  const { data: blogPosts } = await supabaseServer
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('published', true);

  const blogUrls = (blogPosts || []).map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Service‑location pages (category + LGA)
  const { data: catLgaPairs } = await supabaseServer
    .from('providers')
    .select('selected_category_slug, profiles!inner(lga_id)')
    .eq('is_available', true)
    .not('profiles.lga_id', 'is', null);

  const pairs = new Set<string>();
  (catLgaPairs || []).forEach((row: any) => {
    const lgaId = row.profiles?.lga_id;
    if (row.selected_category_slug && lgaId) {
      pairs.add(`/services/${row.selected_category_slug}/in/${lgaId}`);
    }
  });

  const serviceLocationUrls = Array.from(pairs).map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...providerUrls, ...blogUrls, ...serviceLocationUrls];
}