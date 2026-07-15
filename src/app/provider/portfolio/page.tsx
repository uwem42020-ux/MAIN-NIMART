// src/app/provider/portfolio/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Upload, X, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import imageCompression from 'browser-image-compression';
import { NimartSpinner } from '@/components/common/NimartSpinner';

interface PortfolioImage {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
}

export default function Portfolio() {
  const { user } = useAuth();
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<PortfolioImage | null>(null);

  useEffect(() => {
    if (user) fetchImages();
  }, [user]);

  async function fetchImages() {
    const { data } = await supabase
      .from('portfolio_images')
      .select('*')
      .eq('provider_id', user!.id)
      .order('created_at', { ascending: false });
    setImages(data || []);
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    };

    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        const compressedFile = await imageCompression(file, options);
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('portfolio')
          .upload(fileName, compressedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('portfolio')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase
          .from('portfolio_images')
          .insert({
            provider_id: user!.id,
            image_url: urlData.publicUrl,
          });

        if (dbError) throw dbError;
      } catch (error) {
        console.error('Upload failed for file:', file.name, error);
        throw error;
      }
    });

    try {
      await Promise.all(uploadPromises);
      toast.success('Images uploaded successfully!');
      fetchImages();
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function deleteImage(id: string, imageUrl: string) {
    try {
      const { error: dbError } = await supabase
        .from('portfolio_images')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      const urlParts = imageUrl.split('/');
      const filePath = urlParts.slice(-2).join('/');
      await supabase.storage.from('portfolio').remove([filePath]);

      setImages(images.filter(img => img.id !== id));
      toast.success('Image deleted');
    } catch (error: any) {
      toast.error('Failed to delete image');
    }
  }

  async function updateImageDetails(id: string, updates: { title?: string; description?: string }) {
    const { error } = await supabase
      .from('portfolio_images')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success('Updated');
      fetchImages();
      setEditingImage(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
        <label className="cursor-pointer bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Images
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {uploading && (
        <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-md">
          Compressing and uploading images...
        </div>
      )}

      {images.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-600">No portfolio images yet.</p>
          <p className="text-sm text-gray-500">Upload at least 5 images to showcase your work.</p>
          <label className="mt-4 inline-block cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-50">
            <Plus className="inline h-4 w-4 mr-1" />
            Add Images
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group bg-white rounded-lg shadow-sm border overflow-hidden">
                <OptimizedImage
                  src={image.image_url}
                  alt={image.title || 'Portfolio image'}
                  className="aspect-square w-full"
                  width={300}
                />
                <button
                  onClick={() => deleteImage(image.id, image.image_url)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="p-3">
                  {editingImage?.id === image.id ? (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                      const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value;
                      updateImageDetails(image.id, { title, description });
                    }}>
                      <input
                        name="title"
                        defaultValue={image.title || ''}
                        placeholder="Title"
                        className="w-full text-sm border rounded px-2 py-1 mb-1"
                      />
                      <textarea
                        name="description"
                        defaultValue={image.description || ''}
                        placeholder="Description"
                        className="w-full text-sm border rounded px-2 py-1 mb-1"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="text-xs bg-primary-600 text-white px-2 py-1 rounded">Save</button>
                        <button type="button" onClick={() => setEditingImage(null)} className="text-xs text-gray-600">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <h4 className="font-medium text-sm truncate">{image.title || 'Untitled'}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2">{image.description || 'No description'}</p>
                      <button
                        onClick={() => setEditingImage(image)}
                        className="mt-2 text-xs text-primary-600 hover:underline"
                      >
                        Edit details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {images.length < 5 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-md text-yellow-700 text-sm">
              ⚠️ Upload at least 5 images to build trust with customers.
            </div>
          )}
        </>
      )}
    </div>
  );
}