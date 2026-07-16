// src/app/provider/verification/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { Upload, X, CheckCircle, Clock, XCircle, Loader2, AlertCircle, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { NimartSpinner } from '@/components/common/NimartSpinner';

interface VerificationDocument {
  id: string;
  document_type: string;
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
}

const documentTypes = [
  {
    value: 'id_card',
    label: 'Government ID',
    description: 'NIN, International Passport, Voter\'s Card, or Driver\'s License. Must not be expired.',
    required: true
  },
  {
    value: 'business_certificate',
    label: 'Business Registration',
    description: 'CAC certificate or business registration document (if applicable).',
    required: false
  },
  {
    value: 'utility_bill',
    label: 'Utility Bill',
    description: 'Electricity, water, or waste bill. Not older than 6 months.',
    required: false
  },
  {
    value: 'other',
    label: 'Other Identity Document',
    description: 'Any additional document to prove your identity.',
    required: false
  },
];

export default function ProviderVerification() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedType, setSelectedType] = useState('id_card');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['verification-documents', user?.id],
    queryFn: async () => {
      const { data } = await db
        .from('verification_documents')
        .select('*')
        .eq('provider_id', user!.id)
        .order('created_at', { ascending: false });
      return (data as any[]) as VerificationDocument[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Realtime subscription (uses supabase directly - no type issues)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('provider-verification')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'verification_documents', filter: `provider_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['verification-documents', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

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
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }
      setShowCamera(true);
      setCapturedImage(null);
    } catch (error: any) {
      console.error('Camera error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera found on this device.');
      } else {
        toast.error('Unable to access camera. Please use file upload instead.');
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
      const fileName = `${user!.id}/${Date.now()}-${selectedType}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, fileToUpload, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev >= 90 ? prev : prev + 10));
      }, 100);

      const { data: urlData } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(fileName);

      const { error: dbError } = await db
        .from('verification_documents')
        .insert({
          provider_id: user!.id,
          document_type: selectedType,
          document_url: urlData.publicUrl,
        } as any);

      if (dbError) throw dbError;

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['verification-documents', user!.id] });
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

  async function deleteDocument(id: string, documentUrl: string) {
    if (!confirm('Delete this document? This cannot be undone.')) return;

    try {
      const urlParts = documentUrl.split('/');
      const filePath = urlParts.slice(-2).join('/');
      await supabase.storage.from('verification-documents').remove([filePath]);

      const { error: dbError } = await db
        .from('verification_documents')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['verification-documents', user!.id] });
      toast.success('Document deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const getDocumentStatus = (docType: string) => {
    const docsOfType = documents.filter(d => d.document_type === docType);
    if (docsOfType.length === 0) return 'not_uploaded';

    const hasApproved = docsOfType.some(d => d.status === 'approved');
    const hasPending = docsOfType.some(d => d.status === 'pending');
    const allRejected = docsOfType.every(d => d.status === 'rejected');

    if (hasApproved) return 'approved';
    if (hasPending) return 'pending';
    if (allRejected) return 'rejected';
    return 'not_uploaded';
  };

  const pendingCount = documents.filter(d => d.status === 'pending').length;
  const approvedCount = documents.filter(d => d.status === 'approved').length;

  const getOverallStatus = () => {
    if (profile?.is_verified) return 'verified';
    if (pendingCount > 0) return 'pending';
    if (approvedCount > 0 && !profile?.is_verified) return 'in_review';
    if (documents.some(d => d.status === 'rejected') && approvedCount === 0) return 'rejected';
    return 'incomplete';
  };

  const overallStatus = getOverallStatus();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <NimartSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Identity Verification</h1>
      <p className="text-gray-600 mb-6">
        Upload or capture the required documents to verify your identity and earn the verified badge.
      </p>

      {overallStatus === 'verified' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Your account is verified!</p>
            <p className="text-sm text-green-600">The verified badge appears on your profile.</p>
          </div>
        </div>
      )}

      {overallStatus === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <Clock className="h-6 w-6 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">Verification in progress</p>
            <p className="text-sm text-yellow-600">Our team is reviewing your documents. This usually takes 24-48 hours.</p>
          </div>
        </div>
      )}

      {overallStatus === 'in_review' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <Clock className="h-6 w-6 text-blue-600" />
          <div>
            <p className="font-medium text-blue-800">Under final review</p>
            <p className="text-sm text-blue-600">Your documents have been approved. Final verification is in progress.</p>
          </div>
        </div>
      )}

      {overallStatus === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <div>
            <p className="font-medium text-red-800">Documents need attention</p>
            <p className="text-sm text-red-600">Some documents were rejected. Please review the notes and upload new documents.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {documentTypes.map((docType) => {
          const status = getDocumentStatus(docType.value);
          const existingDoc = documents.find(d => d.document_type === docType.value);
          const isDisabled = status === 'approved' || status === 'pending';

          return (
            <div
              key={docType.value}
              className={cn(
                'bg-white rounded-lg shadow-sm border p-5 transition',
                isDisabled && 'opacity-75 bg-gray-50'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {docType.label}
                    {docType.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{docType.description}</p>

                  {status === 'approved' && existingDoc && (
                    <div className="mt-3 flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Approved</span>
                      <a
                        href={existingDoc.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline text-sm ml-3"
                      >
                        View Document
                      </a>
                    </div>
                  )}

                  {status === 'pending' && existingDoc && (
                    <div className="mt-3 flex items-center gap-2 text-yellow-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Pending Review</span>
                      <a
                        href={existingDoc.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline text-sm ml-3"
                      >
                        View Document
                      </a>
                    </div>
                  )}

                  {status === 'rejected' && existingDoc && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">Rejected</span>
                        <a
                          href={existingDoc.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline text-sm ml-3"
                        >
                          View Document
                        </a>
                      </div>
                      {existingDoc.admin_notes && (
                        <p className="text-sm text-red-600 mt-1 ml-6">
                          Reason: {existingDoc.admin_notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {!isDisabled && (
                  <button
                    onClick={() => {
                      setSelectedType(docType.value);
                      setShowUploadModal(true);
                    }}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm"
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </button>
                )}

                {status === 'rejected' && existingDoc && (
                  <button
                    onClick={() => deleteDocument(existingDoc.id, existingDoc.document_url)}
                    className="ml-3 p-2 text-red-500 hover:bg-red-50 rounded"
                    title="Delete and re-upload"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                Upload {documentTypes.find(t => t.value === selectedType)?.label}
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                {documentTypes.find(t => t.value === selectedType)?.description}
              </p>

              <div>
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition flex items-center justify-center gap-2"
                >
                  <Camera className="h-5 w-5 text-primary-600" />
                  <span className="font-medium">Take Photo with Camera</span>
                </button>
                <p className="text-xs text-gray-400 mt-1 text-center">
                  Works best on mobile devices. You can also upload a file below.
                </p>
              </div>

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
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Accepted formats: JPG, PNG, PDF (max 5MB)
                </p>
              </div>

              {capturedImage && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">Captured Image:</p>
                  <img src={capturedImage} alt="Captured" className="w-full rounded-lg border" />
                  <button
                    type="button"
                    onClick={() => setCapturedImage(null)}
                    className="mt-2 text-sm text-red-600 hover:underline"
                  >
                    Retake
                  </button>
                </div>
              )}

              {selectedFile && !capturedImage && (
                <div className="mt-3">
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
                    <div
                      className="h-full bg-primary-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || (!selectedFile && !capturedImage)}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="relative flex-1">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full border-2 border-white/30 flex items-center justify-center">
                <div className="w-64 h-40 border-2 border-white rounded-lg opacity-50"></div>
              </div>
              <p className="absolute bottom-20 left-0 right-0 text-center text-white text-sm">
                Position your document within the frame
              </p>
            </div>
          </div>
          <div className="p-6 bg-black flex justify-center items-center gap-8">
            <button
              onClick={stopCamera}
              className="px-6 py-3 bg-gray-700 text-white rounded-full font-medium"
            >
              Cancel
            </button>
            <button
              onClick={capturePhoto}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center"
            >
              <div className="w-14 h-14 rounded-full border-2 border-gray-400" />
            </button>
            <div className="w-16"></div>
          </div>
        </div>
      )}
    </div>
  );
}