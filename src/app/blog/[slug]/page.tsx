// src/app/blog/[slug]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { useAuth } from '@/contexts/AuthContext';
import { SEO } from '@/components/common/SEO';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Calendar, User, Tag, ArrowLeft, Share2, MessageCircle, Trash2, Send, CornerDownRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface Comment {
  id: number;
  blog_post_id: number;
  user_id: string;
  parent_id: number | null;
  content: string;
  created_at: string;
  updated_at: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function BlogPost() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No slug');
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const postAny = post as any;

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['blog-comments', postAny?.id],
    queryFn: async () => {
      if (!postAny?.id) return [];
      const { data, error } = await db
        .from('blog_comments')
        .select('*, profile:user_id (full_name, avatar_url)')
        .eq('blog_post_id', postAny.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Comment[];
    },
    enabled: !!postAny?.id,
  });

  const { data: relatedPosts } = useQuery({
    queryKey: ['related-posts', postAny?.category, postAny?.id],
    queryFn: async () => {
      if (!postAny?.category || !postAny?.id) return [];
      const { data } = await supabase
        .from('blog_posts')
        .select('id, slug, title, featured_image, created_at')
        .eq('published', true)
        .eq('category', postAny.category)
        .neq('id', postAny.id)
        .order('created_at', { ascending: false })
        .limit(3);
      return data ?? [];
    },
    enabled: !!postAny?.category && !!postAny?.id,
  });

  const shareUrl = `https://nimart.ng/blog/${slug}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: postAny?.title, url: shareUrl }).catch(() => copyLink());
    } else {
      copyLink();
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => toast.success('Link copied!'));
  };

  const submitComment = async () => {
    if (!user) {
      toast.error('Please sign in to comment');
      router.push('/auth/signin');
      return;
    }
    if (!newComment.trim()) return;
    const { error } = await db.from('blog_comments').insert({
      blog_post_id: postAny.id,
      user_id: user.id,
      content: newComment.trim(),
      parent_id: null,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Comment added');
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['blog-comments', postAny.id] });
    }
  };

  const submitReply = async (parentId: number) => {
    if (!user) {
      toast.error('Please sign in to reply');
      router.push('/auth/signin');
      return;
    }
    if (!replyContent.trim()) return;
    const { error } = await db.from('blog_comments').insert({
      blog_post_id: postAny.id,
      user_id: user.id,
      content: replyContent.trim(),
      parent_id: parentId,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Reply added');
      setReplyContent('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['blog-comments', postAny.id] });
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!confirm('Delete this comment?')) return;
    const { error } = await db.from('blog_comments').delete().eq('id', commentId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Comment deleted');
      queryClient.invalidateQueries({ queryKey: ['blog-comments', postAny.id] });
    }
  };

  const topLevelComments = comments?.filter(c => !c.parent_id) || [];
  const getReplies = (parentId: number) => comments?.filter(c => c.parent_id === parentId) || [];
  const isAdmin = profile?.role === 'admin';

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><NimartSpinner size="lg" /></div>;
  }

  if (!post) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Post not found</h2>
        <button onClick={() => router.push('/blog')} className="text-primary-600 hover:underline">Back to blog</button>
      </div>
    );
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": postAny.title,
    "description": postAny.excerpt || postAny.title,
    "image": postAny.featured_image || "https://nimart.ng/og-image.png",
    "datePublished": postAny.created_at,
    "dateModified": postAny.updated_at || postAny.created_at,
    "author": {
      "@type": "Person",
      "name": postAny.author || "Nimart Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Nimart",
      "logo": {
        "@type": "ImageObject",
        "url": "https://nimart.ng/logo.png"
      }
    },
    "url": shareUrl,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": shareUrl
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://nimart.ng" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://nimart.ng/blog" },
      { "@type": "ListItem", "position": 3, "name": postAny.title }
    ]
  };

  return (
    <>
      <SEO
        title={`${postAny.title} | Nimart Blog`}
        description={postAny.excerpt || `Read ${postAny.title} on the Nimart blog – tips for hiring trusted services in Nigeria.`}
        image={postAny.featured_image || '/og-image.png'}
        url={shareUrl}
        type="article"
        schema={[articleSchema, breadcrumbSchema]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Blog', to: '/blog' },
            { label: postAny.title },
          ]}
        />
        <button onClick={() => router.push('/blog')} className="mb-4 flex items-center text-sm text-gray-600 hover:text-primary-600 font-medium">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to blog
        </button>

        <article>
          <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
              {postAny.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-primary-500" />
                <span>{postAny.author || 'Nimart Team'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary-500" />
                <time dateTime={postAny.created_at}>
                  {new Date(postAny.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
              </div>
              {postAny.category && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                  <Tag className="h-3 w-3" />
                  {postAny.category}
                </span>
              )}
            </div>

            {postAny.featured_image && (
              <img
                src={postAny.featured_image}
                alt={postAny.title}
                className="w-full h-auto max-h-96 object-cover rounded-2xl mb-6 shadow-md"
              />
            )}
          </header>

          <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-primary-600 prose-strong:text-gray-900">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" {...props}>
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>{children}</code>
                  );
                },
              }}
            >
              {postAny.content}
            </ReactMarkdown>
          </div>

          {postAny.tags && postAny.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-200">
              {postAny.tags.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Share:</span>
            <button onClick={handleShare} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700">
              <Share2 className="h-5 w-5" />
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${postAny.title} ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-green-50 hover:bg-green-100 text-green-600"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </article>

        <section className="mt-12 pt-10 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments</h2>

          {user ? (
            <div className="mb-8">
              <textarea
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
              />
              <button
                onClick={submitComment}
                className="mt-2 flex items-center gap-2 bg-primary-600 text-white px-5 py-2 rounded-xl hover:bg-primary-700 transition font-medium"
              >
                <Send className="h-4 w-4" /> Post Comment
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 mb-8 text-center">
              <p className="text-gray-600">Please <Link href="/auth/signin" className="text-primary-600 font-medium">sign in</Link> to leave a comment.</p>
            </div>
          )}

          {commentsLoading ? (
            <div className="flex justify-center py-8"><NimartSpinner size="sm" /></div>
          ) : (
            <div className="space-y-6">
              {topLevelComments.map((comment) => (
                <div key={comment.id}>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold flex-shrink-0">
                      {comment.profile?.full_name?.[0] || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900 text-sm">
                            {comment.profile?.full_name || 'Anonymous'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                            {isAdmin && (
                              <button
                                onClick={() => deleteComment(comment.id)}
                                className="text-gray-400 hover:text-red-500 transition"
                                title="Delete comment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
                      </div>
                      <div className="ml-2 mt-1">
                        <button
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1"
                        >
                          <CornerDownRight className="h-3 w-3" /> Reply
                        </button>
                      </div>

                      {replyingTo === comment.id && (
                        <div className="mt-3 ml-4">
                          <textarea
                            rows={2}
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
                          />
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => submitReply(comment.id)}
                              className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700"
                            >
                              Reply
                            </button>
                            <button
                              onClick={() => setReplyingTo(null)}
                              className="text-xs text-gray-500 hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {getReplies(comment.id).map((reply) => (
                        <div key={reply.id} className="ml-8 mt-3 flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold flex-shrink-0">
                            {reply.profile?.full_name?.[0] || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-100 rounded-2xl p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-gray-900 text-sm">
                                  {reply.profile?.full_name || 'Anonymous'}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">
                                    {new Date(reply.created_at).toLocaleDateString()}
                                  </span>
                                  {isAdmin && (
                                    <button
                                      onClick={() => deleteComment(reply.id)}
                                      className="text-gray-400 hover:text-red-500 transition"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {topLevelComments.length === 0 && !commentsLoading && (
                <p className="text-gray-500 text-center py-8">No comments yet. Be the first to share your thoughts!</p>
              )}
            </div>
          )}
        </section>

        {relatedPosts && relatedPosts.length > 0 && (
          <section className="mt-12 pt-10 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedPosts.map((rp: any) => (
                <Link
                  key={rp.id}
                  href={`/blog/${rp.slug}`}
                  className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
                >
                  <div className="h-36 bg-gray-100">
                    {rp.featured_image ? (
                      <img src={rp.featured_image} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-100 to-green-100 flex items-center justify-center text-2xl">📝</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition">{rp.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}