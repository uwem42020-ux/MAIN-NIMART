// src/app/provider/portfolio/page.tsx
'use client';

import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/supabase-any';
import {
  Upload, X, Loader2, Trash2, Camera, Maximize2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import { OptimizedImage } from '@/components/common/OptimizedImage';

export default function ProviderPortfolio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['provider-portfolio', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await db
        .from('portfolio_images')
        .select('*')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  function dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current?.play();
      }
      setShowCamera(true);
      setCapturedImage(null);
    } catch (error: any) {
      console.error('Camera error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Camera permission denied. Please allow camera access.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera found on this device.');
      } else {
        toast.error('Unable to access camera. Use file upload instead.');
      }
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  }

  function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageDataUrl);
      stopCamera();
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setCapturedImage(null);
  }

  async function handleUpload() {
    const fileToUpload = capturedImage
      ? dataURLtoFile(capturedImage, `capture-${Date.now()}.jpg`)
      : selectedFile;

    if (!fileToUpload) {
      toast.error('Please select or capture a file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await (db as any)
        .storage
        .from('portfolio-images')
        .upload(fileName, fileToUpload, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev >= 90 ? prev : prev + 10));
      }, 100);

      const { data: urlData } = (db as any)
        .storage
        .from('portfolio-images')
        .getPublicUrl(fileName);

      const { error: dbError } = await db
        .from('portfolio_images')
        .insert({
          provider_id: user!.id,
          image_url: urlData.publicUrl,
        } as any);

      if (dbError) throw dbError;

      clearInterval(progressInterval);
      setUploadProgress(100);
      toast.success('Image uploaded');
      queryClient.invalidateQueries({ queryKey: ['provider-portfolio', user?.id] });
      setShowUploadModal(false);
      setSelectedFile(null);
      setCapturedImage(null);
      setUploadProgress(0);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  }

  const handleDelete = async (id: string, url: string) => {
    if (!confirm('Delete this image?')) return;
    try {
      const urlParts = url.split('/');
      const filePath = urlParts.slice(-2).join('/');
      await (db as any).storage.from('portfolio-images').remove([filePath]);
      await db.from('portfolio_images').delete().eq('id', id);
      queryClient.invalidateQueries({ queryKey: ['provider-portfolio', user?.id] });
      toast.success('Image deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><NimartSpinner size="md" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
        <button
          onClick={() => { setShowUploadModal(true); setSelectedFile(null); setCapturedImage(null); }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Upload className="h-4 w-4" /> Add Image
        </button>
      </div>

      {portfolio?.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">No portfolio images yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {portfolio?.map((img: any) => (
            <div key={img.id} className="relative group bg-gray-100 rounded-xl overflow-hidden aspect-square">
              <OptimizedImage
                src={img.image_url}
                alt={img.title || 'Portfolio'}
                className="w-full h-full object-cover"
                width={400}
                height={400}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => setLightboxImage(img.image_url)}
                  className="p-2 bg-white/80 rounded-full hover:bg-white"
                  title="View"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(img.id, img.image_url)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Portfolio Image</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={startCamera}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition flex items-center justify-center gap-2"
              >
                <Camera className="h-5 w-5 text-primary-600" />
                <span className="font-medium">Take Photo with Camera</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Choose File from Device</label>
                <input type="file" accept="image/*" onChange={handleFileSelect} disabled={uploading} className="w-full" />
              </div>

              {capturedImage && (
                <div>
                  <p className="text-sm font-medium mb-1">Captured Image:</p>
                  <img src={capturedImage} alt="Captured" className="w-full rounded-lg border" />
                  <button onClick={() => setCapturedImage(null)} className="mt-2 text-sm text-red-600 hover:underline">Retake</button>
                </div>
              )}

              {selectedFile && !capturedImage && (
                <div>
                  <p className="text-sm font-medium mb-1">Selected File:</p>
                  <p className="text-sm text-gray-600">{selectedFile.name}</p>
                </div>
              )}

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Uploading...</span>
                    <span className="font-medium text-primary-600">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setShowUploadModal(false)} disabled={uploading} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                <button onClick={handleUpload} disabled={uploading || (!selectedFile && !capturedImage)} className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</> : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="relative flex-1">
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full border-2 border-white/30 flex items-center justify-center">
                <div className="w-64 h-40 border-2 border-white rounded-lg opacity-50"></div>
              </div>
              <p className="absolute bottom-20 left-0 right-0 text-center text-white text-sm">
                Position your subject within the frame
              </p>
            </div>
          </div>
          <div className="p-6 bg-black flex justify-center items-center gap-8">
            <button onClick={stopCamera} className="px-6 py-3 bg-gray-700 text-white rounded-full font-medium">Cancel</button>
            <button onClick={capturePhoto} className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <div className="w-14 h-14 rounded-full border-2 border-gray-400" />
            </button>
            <div className="w-16"></div>
          </div>
        </div>
      )}

      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightboxImage(null)}>
            <X className="h-8 w-8" />
          </button>
          <img src={lightboxImage} alt="Full size" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}