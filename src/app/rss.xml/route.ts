// src/app/rss.xml/route.ts
import { db } from '@/lib/supabase-any';
import { Feed } from 'feed';

export async function GET() {
  try {
    const { data: posts } = await db
      .from('blog_posts')
      .select('title, slug, excerpt, content, created_at, author, category')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(20);

    const feed = new Feed({
      title: 'Nimart Blog – Tips & Guides for Nigerian Services',
      description: 'Read the Nimart blog for tips on hiring trusted professionals, home services, auto repair, beauty, and more.',
      id: 'https://nimart.ng/blog',
      link: 'https://nimart.ng/blog',
      language: 'en-ng',
      favicon: 'https://nimart.ng/favicon.ico',
      copyright: `All rights reserved ${new Date().getFullYear()}, Nimart`,
      updated: new Date(),
      feedLinks: {
        rss2: 'https://nimart.ng/rss.xml',
      },
      author: {
        name: 'Nimart Team',
        email: 'hello@nimart.ng',
      },
    });

    (posts || []).forEach((post: any) => {
      feed.addItem({
        title: post.title,
        id: `https://nimart.ng/blog/${post.slug}`,
        link: `https://nimart.ng/blog/${post.slug}`,
        description: post.excerpt || '',
        content: post.content || '',
        date: new Date(post.created_at),
        category: post.category ? [{ name: post.category }] : [],
        author: [
          {
            name: post.author || 'Nimart Team',
          },
        ],
      });
    });

    return new Response(feed.rss2(), {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('RSS feed error:', error);
    return new Response('Error generating feed', { status: 500 });
  }
}