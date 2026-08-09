// src/app/provider/setup/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/supabase-any';
import toast from 'react-hot-toast';
import {
  MapPin, Store, Save, AlertCircle, Home, Landmark, Phone,
  Loader2, Info, Camera, Check, ChevronRight, ChevronLeft,
  Upload, X, Navigation,
} from 'lucide-react';
import { TIERS, getCategoriesByTier, getSubcategoriesByCategory } from '@/data/categories';
import type { Category, Subcategory } from '@/data/categories';

const STEPS = ['Profile Picture', 'Business & Location', 'Category', 'Contact & Finish'];

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

  // Step 1: Business & Location
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
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

  // Step 3: Contact & Finish
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
        // Sort: Lagos, FCT, Rivers first
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

  // ── Category chain ──
  useEffect(() => { setCategories(getCategoriesByTier(selectedTier)); setSelectedCategory(''); setSubcategories([]); setSelectedSubcategoryId(''); }, [selectedTier]);
  useEffect(() => { if (selectedCategory) { setSubcategories(getSubcategoriesByCategory(selectedCategory)); setSelectedSubcategoryId(''); } }, [selectedCategory]);

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
          // If reverse geocode fails, still mark location as set with GPS coords
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

  // ── Image upload ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return avatarPreview;
    setUploading(true);
    setUploadProgress(0);
    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
      const { error } = await db.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: true,
        });
      if (error) throw error;
      const { data: urlData } = db.storage.from('avatars').getPublicUrl(fileName);
      const avatarUrl = urlData.publicUrl;
      await db.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
      setUploadProgress(100);
      toast.success('Profile picture uploaded!');
      return avatarUrl;
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
      return null;
    } finally {
      setUploading(false);
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
      case 0: return !!avatarPreview;
      case 1: return businessName.trim().length > 0 && hasLocation;
      case 2: return !!selectedTier && !!selectedCategory && !!selectedSubcategoryId;
      case 3: return !!phoneNumber && !phoneError && !!streetAddress.trim() && termsAccepted;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (step === 0 && avatarFile) {
      await uploadAvatar();
    }
    if (canProceed() && step < 3) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
        p_description: description || null,
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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
      <p className="text-gray-500 mb-6">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

      {/* ── Progress bar ── */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((label, idx) => (
          <div key={idx} className="flex-1">
            <div className={`h-2 rounded-full transition-colors ${idx <= step ? 'bg-primary-500' : 'bg-gray-200'}`} />
            <p className={`text-xs mt-1 text-center ${idx <= step ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
              {label}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ===== STEP 0: PROFILE PICTURE ===== */}
        {step === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <Camera className="h-5 w-5 text-primary-600" /> Profile Picture
            </h2>
            <p className="text-sm text-gray-500 mb-6">A clear photo helps customers trust you. This is required to appear in search results.</p>

            <div className="relative w-40 h-40 mx-auto mb-4">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover rounded-full border-4 border-primary-100" />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center border-4 border-dashed border-gray-300">
                  <Camera className="h-10 w-10 text-gray-400" />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center">
                  <p className="text-white font-bold text-lg">{uploadProgress}%</p>
                  <div className="w-3/4 h-2 bg-white/30 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            <label className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 cursor-pointer transition font-medium">
              <Upload className="h-5 w-5" />
              {avatarPreview ? 'Change Photo' : 'Upload Photo'}
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </label>
            {avatarPreview && !uploading && (
              <button
                type="button"
                onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                className="block mx-auto mt-2 text-sm text-red-500 hover:underline"
              >
                Remove
              </button>
            )}
            <p className="text-xs text-gray-400 mt-3">JPEG or PNG, max 5MB</p>
          </div>
        )}

        {/* ===== STEP 1: BUSINESS & LOCATION ===== */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Store className="h-5 w-5 text-primary-600" /> Business & Location
            </h2>

            {/* GPS button */}
            {!hasLocation && (
              <button
                type="button"
                onClick={detectLocation}
                disabled={detectingLocation}
                className="w-full flex items-center justify-center gap-2 p-4 bg-green-50 border-2 border-green-300 rounded-xl hover:bg-green-100 transition disabled:opacity-50"
              >
                {detectingLocation ? (
                  <><Loader2 className="h-5 w-5 animate-spin text-green-600" /> Detecting your location...</>
                ) : (
                  <><Navigation className="h-5 w-5 text-green-600" /> Auto-detect my location</>
                )}
              </button>
            )}

            {!hasLocation && (
              <p className="text-center text-sm text-gray-400">— or select manually —</p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Ade's Auto Repair"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                placeholder="Briefly describe your services..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <select
                value={selectedStateId}
                onChange={(e) => { setSelectedStateId(e.target.value); setSelectedLgaId(''); setHasLocation(false); }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select State</option>
                {states.map(s => <option key={s.state_id} value={s.state_id}>{s.state_name}</option>)}
              </select>
            </div>

            {selectedStateId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LGA *</label>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select LGA</option>
                  {lgas.map(l => <option key={l.lga_id} value={l.lga_id}>{l.lga_name}</option>)}
                </select>
              </div>
            )}

            {hasLocation && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-sm text-green-700">
                <Check className="h-5 w-5" />
                <span>{selectedLgaName}, {selectedStateName}</span>
              </div>
            )}
          </div>
        )}

        {/* ===== STEP 2: CATEGORY ===== */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Store className="h-5 w-5 text-primary-600" /> Service Category
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier *</label>
              <select value={selectedTier} onChange={(e) => setSelectedTier(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl">
                {TIERS.map(tier => <option key={tier.slug} value={tier.slug}>{tier.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl" disabled={categories.length === 0}>
                <option value="">Select Category</option>
                {categories.map(cat => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory *</label>
              <select value={selectedSubcategoryId} onChange={(e) => setSelectedSubcategoryId(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl" disabled={subcategories.length === 0}>
                <option value="">Select Subcategory</option>
                {subcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ===== STEP 3: CONTACT & FINISH ===== */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary-600" /> Contact & Finish
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                placeholder="+234 123 456 7890"
                maxLength={14}
              />
              {phoneError && <p className="mt-1 text-xs text-red-600">{phoneError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Home className="inline h-4 w-4 mr-1" /> Street Address *
              </label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                placeholder="House number & street name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Landmark className="inline h-4 w-4 mr-1" /> Nearest Landmark (optional)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                placeholder="e.g., Near First Bank"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 text-primary-600 rounded"
              />
              <span className="text-sm text-gray-700">
                I agree to the{' '}
                <Link href="/terms" target="_blank" className="text-primary-600 hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/cookies" target="_blank" className="text-primary-600 hover:underline">Cookie Policy</Link> *
              </span>
            </label>
          </div>
        )}

        {/* ===== ERROR ===== */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800 text-sm">{submitError}</p>
          </div>
        )}

        {/* ===== NAVIGATION ===== */}
        <div className="flex justify-between pt-4">
          {step > 0 ? (
            <button type="button" onClick={handleBack} className="flex items-center gap-2 px-5 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium text-gray-700">
              <ChevronLeft className="h-5 w-5" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button type="button" onClick={handleNext} disabled={!canProceed()} className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 font-medium">
              Continue <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <button type="submit" disabled={loading || !canProceed()} className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 font-medium">
              {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Saving...</> : <><Save className="h-5 w-5" /> Complete Setup</>}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}