// app/sitemap.ts
import { MetadataRoute } from 'next';
import { supabaseServer } from '@/lib/supabase-server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    { url: '/', priority: 1, changeFrequency: 'daily' as const },
    { url: '/search', priority: 0.9, changeFrequency: 'daily' as const },
    { url: '/blog', priority: 0.9, changeFrequency: 'daily' as const },
    { url: '/careers', priority: 0.5, changeFrequency: 'weekly' as const },
    { url: '/auth/signup', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/auth/signin', priority: 0.7, changeFrequency: 'weekly' as const },
    { url: '/help', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/safety', priority: 0.6, changeFrequency: 'monthly' as const },
    { url: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
    { url: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { url: '/cookies', priority: 0.3, changeFrequency: 'yearly' as const },
    { url: '/report', priority: 0.4, changeFrequency: 'monthly' as const },
    { url: '/nimart-vs-nimart', priority: 0.4, changeFrequency: 'monthly' as const },
    { url: '/nimart-explained', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
  ];

  // Provider pages
  const { data: providers } = await supabaseServer
    .from('providers')
    .select('id, updated_at')
    .eq('is_available', true);

  const providerUrls = (providers || []).map((p) => ({
    url: `/provider/${p.id}`,
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
    url: `/blog/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Service‑location pages – use the dedicated RPC (always works)
  const { data: pairs } = await supabaseServer
    .rpc('get_service_location_pairs');

  const serviceLocationUrls = (pairs || []).map((row: any) => ({
    url: `/services/${row.category_slug}/in/${row.lga_id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Combine all
  const allUrls = [
    ...staticPages.map((p) => ({
      url: p.url,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
      lastModified: new Date(),
    })),
    ...providerUrls,
    ...blogUrls,
    ...serviceLocationUrls,
  ];

  return allUrls;
}