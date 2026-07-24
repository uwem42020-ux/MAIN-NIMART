// src/app/rss.xml/route.ts
import { db } from '@/lib/supabase-any';

export async function GET() {
  const { data: posts } = await db
    .from('blog_posts')
    .select('title, slug, excerpt, content, created_at, author, category')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(20);

  const blogPosts = (posts || []) as any[];

  const rssItems = blogPosts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>https://nimart.ng/blog/${post.slug}</link>
      <guid isPermaLink="true">https://nimart.ng/blog/${post.slug}</guid>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
      <description><![CDATA[${post.excerpt || ''}]]></description>
      ${post.category ? `<category>${post.category}</category>` : ''}
      ${post.author ? `<author>${post.author}</author>` : '<author>Nimart Team</author>'}
    </item>`
    )
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nimart Blog – Tips &amp; Guides for Nigerian Services</title>
    <link>https://nimart.ng/blog</link>
    <description>Read the Nimart blog for tips on hiring trusted professionals, home services, auto repair, beauty, and more.</description>
    <language>en-ng</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://nimart.ng/rss.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}