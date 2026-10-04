// src/app/blog/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/supabase-any';
import { buildMetadata } from '@/lib/seo';
import { BlogPostClient } from './BlogPostClient';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  const { data, error } = await db
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: 'Post not found',
      robots: { index: false, follow: false },
    };
  }

  const postAny = post as any;
  const description =
    postAny.excerpt ||
    `Read ${postAny.title} on the Nimart blog - tips for hiring trusted services in Nigeria.`;

  return buildMetadata({
    title: postAny.title,
    description,
    path: `/blog/${slug}`,
    image: postAny.featured_image || '/og-image.png',
    type: 'article',
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return notFound();
  }

  const postAny = post as any;
  const shareUrl = `https://www.nimart.ng/blog/${slug}`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: postAny.title,
    description: postAny.excerpt || postAny.title,
    image: postAny.featured_image || 'https://www.nimart.ng/og-image.png',
    datePublished: postAny.created_at,
    dateModified: postAny.updated_at || postAny.created_at,
    author: {
      '@type': 'Person',
      name: postAny.author || 'Nimart Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Nimart',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.nimart.ng/logo.png',
      },
    },
    url: shareUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': shareUrl,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.nimart.ng' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.nimart.ng/blog' },
      { '@type': 'ListItem', position: 3, name: postAny.title, item: shareUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BlogPostClient slug={slug} initialPost={postAny} />
    </>
  );
}