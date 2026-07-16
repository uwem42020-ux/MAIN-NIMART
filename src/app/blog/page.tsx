// src/app/blog/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SEO } from '@/components/common/SEO';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import { Calendar, ChevronLeft, ChevronRight, Tag } from 'lucide-react';

const POSTS_PER_PAGE = 9;

const blogListSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "name": "Nimart Blog",
  "description": "Tips, guides, and stories about finding trusted services in Nigeria.",
  "url": "https://nimart.ng/blog",
};

export default function Blog() {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts', page, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select('*', { count: 'exact' })
        .eq('published', true)
        .order('created_at', { ascending: false })
        .range((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE - 1);

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return { posts: data ?? [], total: count ?? 0 };
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('category')
        .eq('published', true)
        .not('category', 'is', null);
      if (error) throw error;
      const cats = [...new Set((data as any[]).map((p: any) => p.category))];
      return cats as string[];
    },
  });

  const totalPages = Math.ceil((posts?.total ?? 0) / POSTS_PER_PAGE);

  return (
    <>
      <SEO
        title="Nimart Blog – Tips & Guides for Nigerian Services"
        description="Read the Nimart blog for tips on hiring trusted professionals, home services, auto repair, beauty, and more."
        url="https://nimart.ng/blog"
        type="website"
        schema={blogListSchema}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Nimart Blog</h1>
        <p className="text-gray-600 mb-8 max-w-2xl">
          Tips, guides, and stories to help you find and hire trusted service providers across Nigeria.
        </p>

        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => { setSelectedCategory(null); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${!selectedCategory ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setPage(1); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedCategory === cat ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16"><NimartSpinner size="lg" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts?.posts.map((post: any) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-48 bg-gray-100 overflow-hidden">
                    {post.featured_image ? (
                      <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-100 to-green-100 flex items-center justify-center">
                        <span className="text-4xl">📝</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(post.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-primary-600 font-medium">
                      Read more →
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}