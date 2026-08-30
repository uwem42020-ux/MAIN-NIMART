// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { db } from '@/lib/supabase-any';
import { TIERS } from '@/data/categories';

const BASE_URL = 'https://www.nimart.ng';

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-');
}

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
    { url: `${BASE_URL}/service-marketplace-nigeria`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/top-custodial-service-provider-nigeria`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/event-space-akwa-ibom`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/book-haircut-home-service`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/fridge-repair-near-me-open-now`, priority: 0.9, changeFrequency: 'weekly' as const },
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

  // ── Fetch all available providers once ──
  const { data: allProvidersData } = await db.rpc('get_search_providers');
  const allProviders = Array.isArray(allProvidersData) ? (allProvidersData as any[]) : [];

  // Sets for deduplication
  const stateSet = new Set<string>();
  const categorySet = new Set<string>();
  const categoryStateSet = new Set<string>();
  const lgaSet = new Set<number>();
  const serviceLocationSet = new Set<string>();

  allProviders.forEach((p) => {
    const stateName = p.profile?.state_name;
    const categorySlug = p.selected_category_slug;
    const lgaId = p.profile?.lga_id;

    if (stateName) stateSet.add(stateName);
    if (categorySlug) categorySet.add(categorySlug);
    if (stateName && categorySlug) categoryStateSet.add(`${categorySlug}||${stateName}`);
    if (lgaId) lgaSet.add(lgaId);
    if (categorySlug && lgaId) serviceLocationSet.add(`${categorySlug}||${lgaId}`);
  });

  // State landing pages
  const stateLandingUrls = [...stateSet].map((stateName) => ({
    url: `${BASE_URL}/providers/${slugify(stateName)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Category landing pages
  const categoryLandingUrls = [...categorySet].map((categorySlug) => ({
    url: `${BASE_URL}/categories/${slugify(categorySlug)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Category + State landing pages
  const categoryStateUrls = [...categoryStateSet].map((key) => {
    const [categorySlug, stateName] = key.split('||');
    return {
      url: `${BASE_URL}/categories/${slugify(categorySlug)}/${slugify(stateName)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    };
  });

  // LGA landing pages
  const lgaLandingUrls = [...lgaSet].map((lgaId) => ({
    url: `${BASE_URL}/lga/${lgaId}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Service location pages
  const serviceLocationUrls = [...serviceLocationSet].map((key) => {
    const [categorySlug, lgaId] = key.split('||');
    return {
      url: `${BASE_URL}/services/${categorySlug}/in/${lgaId}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    };
  });

  return [
    ...staticPages,
    ...providerUrls,
    ...blogUrls,
    ...tierUrls,
    ...stateLandingUrls,
    ...categoryLandingUrls,
    ...categoryStateUrls,
    ...lgaLandingUrls,
    ...serviceLocationUrls,
  ];
}