// src/app/admin/blog/page.tsx
'use client';

import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { SEO } from '@/components/common/SEO';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import { Plus, Edit, Trash2, Save, X, Eye, EyeOff, Image, Upload, Loader2 } from 'lucide-react';
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const featuredInputRef = useRef<HTMLInputElement>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const { data, error } = await db
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
    const { error } = await db.from('blog_posts').delete().eq('id', id);
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
      const { error } = await db.from('blog_posts').update(payload).eq('id', editingPost.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Post updated');
    } else {
      const { error } = await db.from('blog_posts').insert(payload);
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
    const { error } = await db.from('blog_posts').update({ published: !post.published }).eq('id', post.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(post.published ? 'Post unpublished' : 'Post published');
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
    }
  };

  // Upload an inline image and insert Markdown into content
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPost) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `blog-images/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const imageUrl = urlData.publicUrl;
      const markdown = `![${file.name}](${imageUrl})`;

      setEditingPost({
        ...editingPost,
        content: (editingPost.content || '') + '\n' + markdown + '\n',
      });

      toast.success('Image uploaded and inserted!');
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Upload featured image
  const handleFeaturedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPost) return;

    setUploadingFeatured(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `blog-featured/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

      setEditingPost({
        ...editingPost,
        featured_image: urlData.publicUrl,
      });

      toast.success('Featured image uploaded!');
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploadingFeatured(false);
      if (featuredInputRef.current) featuredInputRef.current.value = '';
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingPost.featured_image || ''}
                      onChange={(e) => setEditingPost({ ...editingPost, featured_image: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      placeholder="Paste URL or upload"
                    />
                    <input
                      ref={featuredInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFeaturedUpload}
                    />
                    <button
                      type="button"
                      onClick={() => featuredInputRef.current?.click()}
                      disabled={uploadingFeatured}
                      className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"
                    >
                      {uploadingFeatured ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Upload
                    </button>
                  </div>
                  {editingPost.featured_image && (
                    <img src={editingPost.featured_image} alt="Featured preview" className="mt-2 h-24 rounded-lg object-cover" />
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Content (Markdown) *</label>
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 text-xs font-medium text-gray-700"
                    >
                      {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Image className="h-3.5 w-3.5" />}
                      {uploadingImage ? 'Uploading...' : 'Insert Image'}
                    </button>
                    <span className="text-xs text-gray-400 self-center">or paste image URL: ![alt](url)</span>
                  </div>
                </div>
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