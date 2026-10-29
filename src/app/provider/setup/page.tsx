// src/app/provider/setup/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/supabase-any';
import toast from 'react-hot-toast';
import {
  Store, Save, Home, Landmark, Phone,
  Loader2, Camera, Check, ChevronRight, ChevronLeft,
  Upload, Navigation, Image, Trash2,
} from 'lucide-react';
import { TIERS, getCategoriesByTier, getSubcategoriesByCategory } from '@/data/categories';
import type { Category, Subcategory } from '@/data/categories';
import { compressImage } from '@/lib/imageUtils';

const STEPS = ['Profile Picture', 'Business & Location', 'Category', 'Portfolio', 'Contact & Finish'];

const MIN_PORTFOLIO_PHOTOS = 3;
const MIN_DESCRIPTION_LENGTH = 30;

interface PortfolioImage {
  id: string;
  image_url: string;
}

// ── Reusable style tokens (so styling stays consistent) ──
const INPUT_CLS =
  'w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 text-base ' +
  'placeholder:text-gray-400 transition-all duration-200 outline-none ' +
  'focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 ' +
  'hover:border-gray-300 disabled:bg-gray-50 disabled:text-gray-400';

const LABEL_CLS = 'block text-sm font-semibold text-gray-700 mb-1.5';

const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-xl font-semibold text-white ' +
  'bg-gradient-to-r from-primary-600 to-primary-500 shadow-sm shadow-primary-500/20 ' +
  'transition-all duration-200 outline-none ' +
  'hover:from-primary-700 hover:to-primary-600 hover:shadow-md hover:shadow-primary-500/30 ' +
  'focus-visible:ring-4 focus-visible:ring-primary-500/30 ' +
  'active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

const BTN_SECONDARY =
  'inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] rounded-xl font-semibold text-gray-700 ' +
  'bg-white border border-gray-200 transition-all duration-200 outline-none ' +
  'hover:bg-gray-50 hover:border-gray-300 ' +
  'focus-visible:ring-4 focus-visible:ring-gray-300/40 active:scale-[0.98]';

export default function ProviderSetup() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 0: Profile Picture
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  // Step 1: Business & Location
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [descShake, setDescShake] = useState(false);
  const [selectedLgaId, setSelectedLgaId] = useState<string>('');
  const [selectedLgaName, setSelectedLgaName] = useState<string>('');
  const [selectedStateName, setSelectedStateName] = useState<string>('');
  const [mapLat, setMapLat] = useState<number>(9.0556);
  const [mapLng, setMapLng] = useState<number>(7.4914);
  const [hasLocation, setHasLocation] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [states, setStates] = useState<{ state_id: number; state_name: string }[]>([]);
  const [lgas, setLgas] = useState<{ lga_id: number; lga_name: string; lat: number; lng: number }[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>('');

  // Step 2: Category
  const [selectedTier, setSelectedTier] = useState('automotive');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');

  // Step 3: Portfolio
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
  const [portfolioUploading, setPortfolioUploading] = useState(false);

  // Step 4: Contact & Finish
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // ── Fetch states on mount ──
  useEffect(() => {
    async function fetchStates() {
      const { data } = await db.from('lga_centers').select('state_id, state_name').order('state_name');
      if (data) {
        const unique = (data as any[]).filter((v: any, i: number, a: any[]) =>
          a.findIndex((t: any) => t.state_id === v.state_id) === i
        );
        const priority = ['FCT', 'Lagos', 'Rivers'];
        const sorted = unique.sort((a: any, b: any) => {
          const aIdx = priority.indexOf(a.state_name);
          const bIdx = priority.indexOf(b.state_name);
          if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
          if (aIdx !== -1) return -1;
          if (bIdx !== -1) return 1;
          return a.state_name.localeCompare(b.state_name);
        });
        setStates(sorted);
      }
    }
    fetchStates();
  }, []);

  // ── Load LGAs when state changes ──
  useEffect(() => {
    if (!selectedStateId) { setLgas([]); return; }
    async function fetchLgas() {
      const { data } = await db.from('lga_centers')
        .select('lga_id, lga_name, lat, lng')
        .eq('state_id', parseInt(selectedStateId))
        .order('lga_name');
      setLgas((data as any[]) || []);
    }
    fetchLgas();
  }, [selectedStateId]);

  // ── Category chain (Local Data) ──
  useEffect(() => {
    setCategories(getCategoriesByTier(selectedTier));
    setSelectedCategory('');
    setSubcategories([]);
    setSelectedSubcategoryId('');
  }, [selectedTier]);

  useEffect(() => {
    if (selectedCategory) {
      setSubcategories(getSubcategoriesByCategory(selectedCategory));
      setSelectedSubcategoryId('');
    } else {
      setSubcategories([]);
    }
  }, [selectedCategory]);

  // ── Pre-fill existing data ──
  useEffect(() => {
    if (!user) return;
    async function fetchExisting() {
      const { data: provider } = await db.from('providers')
        .select('business_name, description, selected_tier_slug, selected_category_slug, selected_subcategory_id')
        .eq('id', user!.id).single();
      if (provider) {
        const p = provider as any;
        if (p.business_name) setBusinessName(p.business_name);
        if (p.description) setDescription(p.description);
        if (p.selected_tier_slug) setSelectedTier(p.selected_tier_slug);
        if (p.selected_category_slug) setSelectedCategory(p.selected_category_slug);
        if (p.selected_subcategory_id) setSelectedSubcategoryId(p.selected_subcategory_id.toString());
      }
      const { data: profileData } = await db.from('profiles')
        .select('lga_id, lga_name, street_address, landmark, phone, lat, lng, avatar_url')
        .eq('id', user!.id).single();
      if (profileData) {
        const pr = profileData as any;
        if (pr.avatar_url) {
          setAvatarPreview(pr.avatar_url);
          setUploadComplete(true);
        }
        if (pr.lga_id) {
          setSelectedLgaId(pr.lga_id.toString());
          setSelectedLgaName(pr.lga_name || '');
          const { data: lgaInfo } = await db.from('lga_centers').select('state_name, state_id').eq('lga_id', pr.lga_id).single();
          if (lgaInfo) {
            setSelectedStateName((lgaInfo as any).state_name);
            setSelectedStateId((lgaInfo as any).state_id?.toString() || '');
          }
          setHasLocation(true);
        }
        if (pr.lat && pr.lng) { setMapLat(pr.lat); setMapLng(pr.lng); }
        if (pr.street_address) setStreetAddress(pr.street_address);
        if (pr.landmark) setLandmark(pr.landmark);
        if (pr.phone) setPhoneNumber(pr.phone);
      }

      const { data: portfolioData } = await db.from('portfolio_images')
        .select('id, image_url')
        .eq('provider_id', user!.id)
        .order('created_at', { ascending: false });
      if (portfolioData) setPortfolioImages((portfolioData as any[]) || []);
    }
    fetchExisting();
  }, [user]);

  // ── GPS auto-detect ──
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported on this device');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMapLat(latitude);
        setMapLng(longitude);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=en`
          );
          const data = await res.json();
          const address = data?.address;
          if (address) {
            const stateName = address.state || address.region || '';
            const lgaName = address.county || address.city || address.town || '';
            if (stateName && lgaName) {
              const state = states.find(s => s.state_name.toLowerCase() === stateName.toLowerCase());
              if (state) {
                setSelectedStateId(state.state_id.toString());
                const { data: lgasData } = await db.from('lga_centers')
                  .select('lga_id, lga_name, lat, lng')
                  .eq('state_id', state.state_id)
                  .order('lga_name');
                const lgas = (lgasData as any[]) || [];
                setLgas(lgas);
                const lga = lgas.find((l: any) => l.lga_name.toLowerCase() === lgaName.toLowerCase());
                if (lga) {
                  setSelectedLgaId(lga.lga_id.toString());
                  setSelectedLgaName(lga.lga_name);
                  setSelectedStateName(state.state_name);
                  setMapLat(lga.lat);
                  setMapLng(lga.lng);
                  setHasLocation(true);
                  toast.success(`Detected: ${lga.lga_name}, ${state.state_name}`);
                }
              }
            }
          }
        } catch {
          toast.success('Location detected from GPS');
          setHasLocation(true);
        }
        setDetectingLocation(false);
      },
      () => {
        toast.error('Location access denied. Please select manually.');
        setDetectingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [states]);

  // ── Avatar upload (WITH COMPRESSION) ──
  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const compressedFile = await compressImage(file);

    const fileExt = 'jpg';
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
    const { error } = await db.storage
      .from('avatars')
      .upload(fileName, compressedFile, { cacheControl: '3600', upsert: true });
    if (error) throw error;
    const { data: urlData } = db.storage.from('avatars').getPublicUrl(fileName);
    const avatarUrl = urlData.publicUrl;
    await db.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
    return avatarUrl;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setUploadComplete(false);
    setUploadProgress(0);
    setUploading(true);

    let pct = 0;
    const ticker = setInterval(() => {
      pct = Math.min(pct + 6, 90);
      setUploadProgress(pct);
    }, 120);

    try {
      await uploadAvatar(file);
      clearInterval(ticker);
      setUploadProgress(100);
      setUploadComplete(true);
      toast.success('Profile picture uploaded!');
      setTimeout(() => setUploading(false), 400);
    } catch (err: any) {
      clearInterval(ticker);
      setUploadProgress(0);
      setUploading(false);
      setUploadComplete(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.error(err?.message || 'Upload failed');
    }
  };

  // ── Portfolio upload (Step 3) — bucket: 'portfolio' ──
  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      e.target.value = '';
      return;
    }

    setPortfolioUploading(true);
    try {
      const compressed = await compressImage(file);
      const fileName = `${user.id}/portfolio-${Date.now()}.jpg`;
      const { error: uploadError } = await db.storage
        .from('portfolio')
        .upload(fileName, compressed, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = db.storage.from('portfolio').getPublicUrl(fileName);

      const { data: inserted, error: dbError } = await db
        .from('portfolio_images')
        .insert({ provider_id: user.id, image_url: urlData.publicUrl } as any)
        .select('id, image_url')
        .single();
      if (dbError) throw dbError;

      setPortfolioImages(prev => [inserted as any, ...prev]);
      toast.success('Photo added');
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setPortfolioUploading(false);
      e.target.value = '';
    }
  };

  const removePortfolioImage = async (id: string, url: string) => {
    if (!confirm('Delete this photo?')) return;
    try {
      const urlParts = url.split('/');
      const filePath = urlParts.slice(-2).join('/');
      await db.storage.from('portfolio').remove([filePath]);
      await db.from('portfolio_images').delete().eq('id', id);
      setPortfolioImages(prev => prev.filter(p => p.id !== id));
      toast.success('Photo deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed');
    }
  };

  // ── Phone validation ──
  const validatePhoneNumber = (phone: string): boolean => {
    const local = phone.replace('+234', '');
    const ok = /^\d{10}$/.test(local);
    setPhoneError(ok ? '' : 'Enter valid 10-digit Nigerian phone number');
    return ok;
  };
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+234')) val = '+234' + val.replace(/\D/g, '');
    const digits = val.slice(4).replace(/\D/g, '').slice(0, 10);
    setPhoneNumber('+234' + digits);
    if (digits.length === 10) validatePhoneNumber('+234' + digits);
    else setPhoneError('');
  };

  // ── Step validation ──
  const canProceed = (): boolean => {
    switch (step) {
      case 0: return !!avatarPreview && uploadComplete;
      case 1: return businessName.trim().length > 0 && hasLocation;
      case 2: return !!selectedTier && !!selectedCategory && !!selectedSubcategoryId;
      case 3: return portfolioImages.length >= MIN_PORTFOLIO_PHOTOS;
      case 4: return !!phoneNumber && !phoneError && !!streetAddress.trim() && termsAccepted;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (step >= 4) return;

    if (step === 1) {
      if (businessName.trim().length === 0 || !hasLocation) return;
      if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
        setDescShake(true);
        toast.error(`Please write at least ${MIN_DESCRIPTION_LENGTH} characters for the description`);
        return;
      }
    } else {
      if (!canProceed()) return;
    }

    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ── Final submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!canProceed()) return;

    if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
      setStep(1);
      setDescShake(true);
      toast.error(`Please write at least ${MIN_DESCRIPTION_LENGTH} characters for the description`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      const params = {
        p_user_id: user!.id,
        p_business_name: businessName,
        p_phone: phoneNumber,
        p_street_address: streetAddress,
        p_address_area: selectedLgaName,
        p_landmark: landmark || null,
        p_lga_id: parseInt(selectedLgaId),
        p_lat: mapLat,
        p_lng: mapLng,
        p_description: description.trim(),
        p_selected_tier_slug: selectedTier,
        p_selected_category_slug: selectedCategory,
        p_selected_subcategory_id: parseInt(selectedSubcategoryId),
      };
      const { data, error } = await db.rpc('complete_provider_setup', params as any);
      if (error) throw error;
      if (!(data as any).success) throw new Error((data as any).error);

      try { await refreshProfile(); } catch {}

      toast.success('Profile setup complete!');
      router.push('/provider/dashboard');
    } catch (err: any) {
      setSubmitError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const descriptionLength = description.trim().length;
  const descriptionMet = descriptionLength >= MIN_DESCRIPTION_LENGTH;
  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <style>{`
        @keyframes nimart-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        @keyframes nimart-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nimart-pop {
          0%   { transform: scale(0.4); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes nimart-pulse-soft {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.55; }
        }
        .animate-fade-up { animation: nimart-fade-up 0.35s cubic-bezier(0.22,1,0.36,1); }
        .animate-pop     { animation: nimart-pop 0.45s cubic-bezier(0.22,1,0.36,1); }
        .animate-pulse-soft { animation: nimart-pulse-soft 1.8s ease-in-out infinite; }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* Header */}
        <div className="mb-6 sm:mb-8 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse-soft" />
            Step {step + 1} of {STEPS.length}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 tracking-tight">
            Complete Your Profile
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            {STEPS[step]}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1.5 sm:gap-2 mb-6 sm:mb-8">
          {STEPS.map((label, idx) => {
            const isComplete = idx < step;
            const isCurrent = idx === step;
            return (
              <div key={idx} className="flex-1 group">
                <div className="relative h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${
                      isComplete
                        ? 'w-full bg-gradient-to-r from-primary-600 to-primary-500'
                        : isCurrent
                          ? 'w-full bg-gradient-to-r from-primary-500 to-primary-400 animate-pulse-soft'
                          : 'w-0 bg-gray-300'
                    }`}
                  />
                </div>
                <p
                  className={`hidden sm:block text-[11px] mt-1.5 text-center truncate transition-colors duration-300 ${
                    isComplete || isCurrent
                      ? 'text-primary-600 font-semibold'
                      : 'text-gray-400 font-medium'
                  }`}
                >
                  {label}
                </p>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* keyed wrapper → re-triggers fade-up animation on step change */}
          <div key={step} className="animate-fade-up">

            {/* ===== STEP 0: PROFILE PICTURE ===== */}
            {step === 0 && (
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 sm:p-8 text-center">
                <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center justify-center gap-2">
                  <Camera className="h-5 w-5 text-primary-600" /> Profile Picture
                </h2>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                  A clear photo helps customers trust you. This is required to appear in search results.
                </p>

                <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-5">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className={`w-full h-full object-cover rounded-full border-4 transition-all duration-500 ${
                        uploadComplete
                          ? 'border-green-500 shadow-lg shadow-green-500/20'
                          : 'border-primary-100'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center border-4 border-dashed border-gray-200">
                      <Camera className="h-10 w-10 text-gray-300" />
                    </div>
                  )}

                  {uploading && (
                    <div className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                      <p className="text-white font-bold text-lg">{uploadProgress}%</p>
                      <div className="w-3/4 h-1.5 bg-white/30 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-white rounded-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-white/90 text-xs mt-1.5">Uploading…</p>
                    </div>
                  )}

                  {uploadComplete && !uploading && (
                    <div className="absolute bottom-1 right-1 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-500 border-4 border-white flex items-center justify-center shadow-lg animate-pop">
                      <Check className="h-5 w-5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>

                {uploadComplete && !uploading && (
                  <p className="text-sm text-green-600 font-semibold mb-4 animate-fade-up">
                    ✓ Profile picture uploaded
                  </p>
                )}

                <label className={`${BTN_PRIMARY} cursor-pointer inline-flex`}>
                  <Upload className="h-5 w-5" />
                  {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>

                {avatarPreview && !uploading && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(null);
                      setUploadComplete(false);
                      setUploadProgress(0);
                    }}
                    className="block mx-auto mt-3 text-sm font-medium text-red-500 hover:text-red-600 transition-colors outline-none focus-visible:underline"
                  >
                    Remove photo
                  </button>
                )}
                <p className="text-xs text-gray-400 mt-4">JPEG or PNG · max 5MB</p>
              </div>
            )}

            {/* ===== STEP 1: BUSINESS & LOCATION ===== */}
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 sm:p-8 space-y-5">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary-600" /> Business & Location
                </h2>

                {!hasLocation && (
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={detectingLocation}
                    className="w-full flex items-center justify-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl transition-all duration-200 outline-none hover:bg-green-100 hover:border-green-300 focus-visible:ring-4 focus-visible:ring-green-400/30 disabled:opacity-50 active:scale-[0.99]"
                  >
                    {detectingLocation ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                        <span className="font-semibold text-green-700">Detecting your location...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-700">Auto-detect my location</span>
                      </>
                    )}
                  </button>
                )}

                {!hasLocation && (
                  <p className="text-center text-xs text-gray-400 uppercase tracking-wider font-medium">
                    — or select manually —
                  </p>
                )}

                <div>
                  <label className={LABEL_CLS}>Business Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    className={INPUT_CLS}
                    placeholder="e.g., Ade's Auto Repair"
                  />
                </div>

                <div>
                  <label className={LABEL_CLS}>Description <span className="text-red-500">*</span></label>
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (descShake) setDescShake(false);
                    }}
                    rows={3}
                    style={{ animation: descShake ? 'nimart-shake 0.5s ease-in-out' : undefined }}
                    onAnimationEnd={() => setDescShake(false)}
                    className={`w-full px-4 py-3 rounded-xl text-base transition-all duration-200 outline-none resize-none ${
                      descShake
                        ? 'bg-red-50 border-2 border-red-500 ring-4 ring-red-500/10'
                        : 'bg-white border border-gray-200 hover:border-gray-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10'
                    }`}
                    placeholder="Short description about you or your skill. E.g., I fix leaking pipes, install taps, and repair water tanks in Lagos."
                  />
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="h-1 flex-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          descriptionMet ? 'bg-green-500 w-full' : 'bg-amber-400'
                        }`}
                        style={{ width: `${Math.min(100, (descriptionLength / MIN_DESCRIPTION_LENGTH) * 100)}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium whitespace-nowrap transition-colors ${
                        descriptionMet
                          ? 'text-green-600'
                          : descShake
                            ? 'text-red-600'
                            : 'text-gray-500'
                      }`}
                    >
                      {descriptionMet
                        ? `${descriptionLength} chars ✓`
                        : `${descriptionLength}/${MIN_DESCRIPTION_LENGTH}`}
                    </span>
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLS}>State <span className="text-red-500">*</span></label>
                  <select
                    value={selectedStateId}
                    onChange={(e) => {
                      setSelectedStateId(e.target.value);
                      setSelectedLgaId('');
                      setHasLocation(false);
                    }}
                    className={INPUT_CLS}
                  >
                    <option value="">Select State</option>
                    {states.map(s => (
                      <option key={s.state_id} value={s.state_id}>{s.state_name}</option>
                    ))}
                  </select>
                </div>

                {selectedStateId && (
                  <div className="animate-fade-up">
                    <label className={LABEL_CLS}>LGA <span className="text-red-500">*</span></label>
                    <select
                      value={selectedLgaId}
                      onChange={(e) => {
                        const lga = lgas.find(l => l.lga_id === parseInt(e.target.value));
                        if (lga) {
                          setSelectedLgaId(lga.lga_id.toString());
                          setSelectedLgaName(lga.lga_name);
                          setMapLat(lga.lat);
                          setMapLng(lga.lng);
                          const state = states.find(s => s.state_id === parseInt(selectedStateId));
                          if (state) setSelectedStateName(state.state_name);
                          setHasLocation(true);
                        }
                      }}
                      className={INPUT_CLS}
                    >
                      <option value="">Select LGA</option>
                      {lgas.map(l => (
                        <option key={l.lga_id} value={l.lga_id}>{l.lga_name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {hasLocation && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm font-medium text-green-700 animate-fade-up">
                    <Check className="h-5 w-5 flex-shrink-0" />
                    <span>{selectedLgaName}, {selectedStateName}</span>
                  </div>
                )}
              </div>
            )}

            {/* ===== STEP 2: CATEGORY ===== */}
            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 sm:p-8 space-y-5">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary-600" /> Service Category
                </h2>

                <div>
                  <label className={LABEL_CLS}>Tier <span className="text-red-500">*</span></label>
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className={INPUT_CLS}
                  >
                    {TIERS.map(tier => (
                      <option key={tier.slug} value={tier.slug}>{tier.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={LABEL_CLS}>Category <span className="text-red-500">*</span></label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={INPUT_CLS}
                    disabled={categories.length === 0}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={LABEL_CLS}>Subcategory <span className="text-red-500">*</span></label>
                  <select
                    value={selectedSubcategoryId}
                    onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                    className={INPUT_CLS}
                    disabled={subcategories.length === 0}
                  >
                    <option value="">Select Subcategory</option>
                    {subcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ===== STEP 3: PORTFOLIO ===== */}
            {step === 3 && (
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 sm:p-8 space-y-5">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary-600" /> Portfolio Photos
                </h2>
                <p className="text-sm text-gray-500">
                  Upload at least {MIN_PORTFOLIO_PHOTOS} photos of your previous work. This is required for customers to find you in search.
                </p>

                {portfolioImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {portfolioImages.map((img) => (
                      <div
                        key={img.id}
                        className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group ring-1 ring-gray-100"
                      >
                        <img
                          src={img.image_url}
                          alt="Portfolio"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <button
                          type="button"
                          onClick={() => removePortfolioImage(img.id, img.image_url)}
                          className="absolute top-1.5 right-1.5 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 outline-none hover:bg-red-600 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-400 scale-90 group-hover:scale-100"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label
                  className="w-full flex items-center justify-center gap-2 p-5 border-2 border-dashed border-primary-200 rounded-xl cursor-pointer transition-all duration-200 bg-primary-50/30 hover:bg-primary-50 hover:border-primary-400 outline-none focus-within:ring-4 focus-within:ring-primary-500/20"
                >
                  {portfolioUploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                      <span className="font-semibold text-primary-700">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-primary-600" />
                      <span className="font-semibold text-primary-700">
                        {portfolioImages.length >= MIN_PORTFOLIO_PHOTOS ? 'Add more photos' : 'Upload a photo'}
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePortfolioUpload}
                    className="hidden"
                    disabled={portfolioUploading}
                  />
                </label>

                <div
                  className={`flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-colors duration-300 ${
                    portfolioImages.length >= MIN_PORTFOLIO_PHOTOS
                      ? 'bg-green-50 text-green-700 border border-green-100'
                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}
                >
                  <span>
                    {portfolioImages.length >= MIN_PORTFOLIO_PHOTOS ? (
                      <>✓ {portfolioImages.length} photos — you&apos;re good to go</>
                    ) : (
                      <>{portfolioImages.length} of {MIN_PORTFOLIO_PHOTOS} minimum — need {MIN_PORTFOLIO_PHOTOS - portfolioImages.length} more</>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* ===== STEP 4: CONTACT & FINISH ===== */}
            {step === 4 && (
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 sm:p-8 space-y-5">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary-600" /> Contact & Finish
                </h2>

                <div>
                  <label className={LABEL_CLS}>Phone Number <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    required
                    className={INPUT_CLS}
                    placeholder="+234 123 456 7890"
                    maxLength={14}
                  />
                  {phoneError && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium animate-fade-up">{phoneError}</p>
                  )}
                </div>

                <div>
                  <label className={LABEL_CLS}>
                    <Home className="inline h-4 w-4 mr-1 -mt-0.5" /> Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    required
                    className={INPUT_CLS}
                    placeholder="House number & street name"
                  />
                </div>

                <div>
                  <label className={LABEL_CLS}>
                    <Landmark className="inline h-4 w-4 mr-1 -mt-0.5" /> Nearest Landmark <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className={INPUT_CLS}
                    placeholder="e.g., Near First Bank"
                  />
                </div>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl transition-colors hover:bg-gray-50 outline-none focus-within:ring-4 focus-within:ring-primary-500/10">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-primary-600 rounded border-gray-300 outline-none focus:ring-2 focus:ring-primary-500/40 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 leading-relaxed">
                    I agree to the{' '}
                    <Link href="/terms" target="_blank" className="text-primary-600 font-medium hover:underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/cookies" target="_blank" className="text-primary-600 font-medium hover:underline">Cookie Policy</Link>{' '}
                    <span className="text-red-500">*</span>
                  </span>
                </label>
              </div>
            )}
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-up">
              <p className="text-red-800 text-sm font-medium">{submitError}</p>
            </div>
          )}

          {/* ── Action Bar (sticky on mobile) ── */}
          <div
            className="sticky bottom-0 -mx-4 px-4 py-3 mt-6 bg-white/85 backdrop-blur-md border-t border-gray-100
                       sm:static sm:mx-0 sm:px-0 sm:py-0 sm:mt-4 sm:bg-transparent sm:backdrop-blur-none sm:border-0
                       flex justify-between items-center gap-3 pt-4"
          >
            {step > 0 ? (
              <button type="button" onClick={handleBack} className={BTN_SECONDARY}>
                <ChevronLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
            ) : (
              <div />
            )}

            {!isLastStep ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  step === 0
                    ? (!avatarPreview || !uploadComplete || uploading)
                    : (step !== 1 && !canProceed()) || uploading || portfolioUploading
                }
                className={`${BTN_PRIMARY} flex-1 sm:flex-initial`}
              >
                Continue <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !canProceed()}
                className={`${BTN_PRIMARY} flex-1 sm:flex-initial`}
              >
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-5 w-5" /> Complete Setup</>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}