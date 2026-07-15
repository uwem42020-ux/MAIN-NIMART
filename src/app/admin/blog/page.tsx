// src/app/admin/blog/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SEO } from '@/components/common/SEO';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import { Plus, Edit, Trash2, Save, X, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featured_image: string;
  category: string;
  tags: string[];
  author: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

const emptyPost: Partial<BlogPost> = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  featured_image: '',
  category: '',
  tags: [],
  author: 'Nimart Team',
  published: false,
};

export default function AdminBlog() {
  const queryClient = useQueryClient();
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const handleCreateNew = () => {
    setEditingPost({ ...emptyPost });
    setShowForm(true);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost({ ...post });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this post permanently?')) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Post deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
    }
  };

  const handleSave = async () => {
    if (!editingPost) return;
    const { title, slug, content } = editingPost;
    if (!title || !slug || !content) {
      toast.error('Title, slug, and content are required');
      return;
    }

    const payload = {
      ...editingPost,
      tags: editingPost.tags || [],
      updated_at: new Date().toISOString(),
    };

    if (editingPost.id) {
      // Update
      const { error } = await supabase
        .from('blog_posts')
        .update(payload as unknown as Record<string, any>)
        .eq('id', editingPost.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Post updated');
    } else {
      // Insert
      const { error } = await supabase.from('blog_posts').insert(payload as unknown as Record<string, any>);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Post created');
    }
    setShowForm(false);
    setEditingPost(null);
    queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
  };

  const handleTogglePublished = async (post: BlogPost) => {
    const { error } = await supabase
      .from('blog_posts')
      .update({ published: !post.published })
      .eq('id', post.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(post.published ? 'Post unpublished' : 'Post published');
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
    }
  };

  return (
    <>
      <SEO title="Manage Blog - Admin" />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition font-medium"
          >
            <Plus className="h-5 w-5" /> New Post
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><NimartSpinner size="lg" /></div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">Title</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">Category</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">Date</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {posts?.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {post.title}
                      <div className="text-xs text-gray-500">/{post.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{post.category || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        post.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {post.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTogglePublished(post)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600"
                          title={post.published ? 'Unpublish' : 'Publish'}
                        >
                          {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(post)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {posts?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No posts yet. Click "New Post" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Editor Modal */}
        {showForm && editingPost && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-black/50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editingPost.id ? 'Edit Post' : 'New Post'}</h2>
                <button onClick={() => { setShowForm(false); setEditingPost(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={editingPost.title || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input
                    type="text"
                    value={editingPost.slug || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingPost.category || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    placeholder="e.g. Home Services"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                  <input
                    type="text"
                    value={editingPost.author || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={editingPost.tags?.join(', ') || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    placeholder="plumbers, lagos, home-services"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                  <textarea
                    rows={2}
                    value={editingPost.excerpt || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL</label>
                  <input
                    type="text"
                    value={editingPost.featured_image || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, featured_image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Content (Markdown) *</label>
                <textarea
                  rows={16}
                  value={editingPost.content || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-3 mb-6">
                <input
                  type="checkbox"
                  id="published"
                  checked={editingPost.published || false}
                  onChange={(e) => setEditingPost({ ...editingPost, published: e.target.checked })}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <label htmlFor="published" className="text-sm font-medium text-gray-700">
                  Publish immediately
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowForm(false); setEditingPost(null); }}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg hover:bg-primary-700 font-medium"
                >
                  <Save className="h-5 w-5" /> Save Post
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}