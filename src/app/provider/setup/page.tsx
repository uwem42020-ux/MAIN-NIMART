// src/app/provider/setup/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import toast from 'react-hot-toast';
import { MapPin, Store, Save, AlertCircle, Home, Landmark, Phone, Loader2, Info, ChevronDown } from 'lucide-react';
import { TIERS, getCategoriesByTier, getSubcategoriesByCategory } from '@/data/categories';
import { LocationPickerModal } from '@/components/provider/LocationPickerModal';
import type { Category, Subcategory } from '@/data/categories';

const STORAGE_KEY = 'nimart_provider_setup';

export default function ProviderSetup() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Location picker modal
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Location from map or dropdowns
  const [selectedLgaId, setSelectedLgaId] = useState<string>('');
  const [selectedLgaName, setSelectedLgaName] = useState<string>('');
  const [selectedStateName, setSelectedStateName] = useState<string>('');
  const [mapLat, setMapLat] = useState<number>(9.0556);
  const [mapLng, setMapLng] = useState<number>(7.4914);
  const [detectedArea, setDetectedArea] = useState<string>('');
  const [hasLocation, setHasLocation] = useState<boolean>(false);

  // Manual address fields
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');

  // Business info
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');

  // Phone
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Category
  const [selectedTier, setSelectedTier] = useState('automotive');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');

  // Terms
  const [termsAccepted, setTermsAccepted] = useState(false);

  // States and LGAs
  const [states, setStates] = useState<{ state_id: number; state_name: string }[]>([]);
  const [lgas, setLgas] = useState<{ lga_id: number; lga_name: string; lat: number; lng: number }[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [mapExpanded, setMapExpanded] = useState(false);

  // ---- LocalStorage persistence ----
  useEffect(() => {
    if (!initialLoading) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setBusinessName(data.businessName || '');
        setDescription(data.description || '');
        setPhoneNumber(data.phoneNumber || '');
        setStreetAddress(data.streetAddress || '');
        setLandmark(data.landmark || '');
        setSelectedTier(data.selectedTier || 'automotive');
        setSelectedCategory(data.selectedCategory || '');
        setSelectedSubcategoryId(data.selectedSubcategoryId || '');
        setTermsAccepted(data.termsAccepted || false);
        if (data.hasLocation) {
          setSelectedLgaId(data.selectedLgaId || '');
          setSelectedLgaName(data.selectedLgaName || '');
          setSelectedStateName(data.selectedStateName || '');
          setMapLat(data.mapLat || 9.0556);
          setMapLng(data.mapLng || 7.4914);
          setDetectedArea(data.detectedArea || '');
          setHasLocation(data.hasLocation);
        }
      } catch (e) { console.error('Failed to load saved data', e); }
    }
  }, [initialLoading]);

  useEffect(() => {
    if (initialLoading) return;
    const toSave = {
      businessName, description, phoneNumber, streetAddress, landmark,
      selectedTier, selectedCategory, selectedSubcategoryId, termsAccepted,
      selectedLgaId, selectedLgaName, selectedStateName, mapLat, mapLng, detectedArea, hasLocation
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [businessName, description, phoneNumber, streetAddress, landmark, selectedTier, selectedCategory, selectedSubcategoryId, termsAccepted, selectedLgaId, selectedLgaName, selectedStateName, mapLat, mapLng, detectedArea, hasLocation, initialLoading]);

  // ---- Fetch states ----
  useEffect(() => {
    async function fetchStates() {
      const { data } = await db.from('lga_centers').select('state_id, state_name').order('state_name');
      if (data) {
        const unique = (data as any[]).filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.state_id === v.state_id) === i);
        setStates(unique);
      }
    }
    fetchStates();
  }, []);

  // ---- Load LGAs when state changes ----
  useEffect(() => {
    if (!selectedStateId) { setLgas([]); return; }
    async function fetchLgas() {
      const { data } = await db.from('lga_centers').select('lga_id, lga_name, lat, lng').eq('state_id', parseInt(selectedStateId)).order('lga_name');
      setLgas((data as any[]) || []);
    }
    fetchLgas();
  }, [selectedStateId]);

  // Category effects
  useEffect(() => { setCategories(getCategoriesByTier(selectedTier)); setSelectedCategory(''); setSubcategories([]); setSelectedSubcategoryId(''); }, [selectedTier]);
  useEffect(() => { if (selectedCategory) { setSubcategories(getSubcategoriesByCategory(selectedCategory)); setSelectedSubcategoryId(''); } }, [selectedCategory]);

  // Pre‑fill existing data
  useEffect(() => {
    if (!user) return;
    async function fetchExisting() {
      const { data: provider } = await db.from('providers').select('business_name, description, selected_tier_slug, selected_category_slug, selected_subcategory_id').eq('id', user.id).single();
      if (provider) {
        const p = provider as any;
        setBusinessName(p.business_name || '');
        setDescription(p.description || '');
        if (p.selected_tier_slug) setSelectedTier(p.selected_tier_slug);
        if (p.selected_category_slug) setSelectedCategory(p.selected_category_slug);
        if (p.selected_subcategory_id) setSelectedSubcategoryId(p.selected_subcategory_id.toString());
      }
      const { data: profileData } = await db.from('profiles').select('lga_id, lga_name, street_address, landmark, phone, address_area, lat, lng').eq('id', user.id).single();
      if (profileData) {
        const pr = profileData as any;
        if (pr.lga_id) {
          setSelectedLgaId(pr.lga_id.toString());
          setSelectedLgaName(pr.lga_name || '');
          const { data: lgaInfo } = await db.from('lga_centers').select('state_name').eq('lga_id', pr.lga_id).single();
          if (lgaInfo) setSelectedStateName((lgaInfo as any).state_name);
        }
        setStreetAddress(pr.street_address || '');
        setLandmark(pr.landmark || '');
        if (pr.phone) setPhoneNumber(pr.phone);
        setDetectedArea(pr.address_area || '');
        if (pr.lat && pr.lng) {
          setMapLat(pr.lat); setMapLng(pr.lng); setHasLocation(true);
        }
      }
      setInitialLoading(false);
    }
    fetchExisting();
  }, [user]);

  // Phone validation
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
    const final = '+234' + digits;
    setPhoneNumber(final);
    if (digits.length === 10) validatePhoneNumber(final); else setPhoneError('');
  };

  // Handle LGA selection from dropdown
  const handleLgaSelect = (lgaId: string, lgaName: string, lat: number, lng: number) => {
    setSelectedLgaId(lgaId);
    setSelectedLgaName(lgaName);
    setMapLat(lat);
    setMapLng(lng);
    setDetectedArea(lgaName);
    setHasLocation(true);

    const stateObj = states.find(s => s.state_id === parseInt(selectedStateId));
    if (stateObj) setSelectedStateName(stateObj.state_name);

    toast.success(`Location set to ${lgaName}, ${stateObj?.state_name || ''}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!businessName.trim()) { toast.error('Business name required'); return; }
    if (!validatePhoneNumber(phoneNumber)) return;
    if (!selectedLgaId) { toast.error('Please select your state and LGA'); return; }
    if (!streetAddress.trim()) { toast.error('Street address required'); return; }
    if (!selectedTier || !selectedCategory || !selectedSubcategoryId) { toast.error('Complete service category selection'); return; }
    if (!termsAccepted) { toast.error('Accept Terms of Service and Cookie Policy'); return; }

    setLoading(true);
    try {
      const params = {
        p_user_id: user!.id,
        p_business_name: businessName, p_phone: phoneNumber,
        p_street_address: streetAddress, p_address_area: detectedArea,
        p_landmark: landmark || null, p_lga_id: parseInt(selectedLgaId),
        p_lat: mapLat, p_lng: mapLng, p_description: description || null,
        p_selected_tier_slug: selectedTier, p_selected_category_slug: selectedCategory,
        p_selected_subcategory_id: parseInt(selectedSubcategoryId),
      };
      const { data, error } = await db.rpc('complete_provider_setup', params as any);
      if (error) throw error;
      if (!(data as any).success) throw new Error((data as any).error);

      // Try to refresh the profile – if it fails, still navigate
      try { await refreshProfile(); } catch {}

      localStorage.removeItem(STORAGE_KEY);
      toast.success('Profile setup complete! Please upload a profile picture and set a password.');
      router.push('/provider/profile');
    } catch (err: any) { setSubmitError(err.message); toast.error(err.message); }
    finally { setLoading(false); }
  };

  if (initialLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Provider Profile</h1>
      <p className="text-gray-600 mb-2">This information helps customers find and trust you.</p>
      <p className="text-sm text-amber-600 mb-6 flex items-start gap-1"><AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /><span>Your full name must match your official ID for verification.</span></p>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ===== LOCATION SECTION ===== */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-primary-600" />Service Location</h2>

          {/* State Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
            <select value={selectedStateId} onChange={(e) => { setSelectedStateId(e.target.value); setSelectedLgaId(''); setHasLocation(false); }} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
              <option value="">Select State</option>
              {states.map(s => <option key={s.state_id} value={s.state_id}>{s.state_name}</option>)}
            </select>
          </div>

          {/* LGA Dropdown */}
          {selectedStateId && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">LGA *</label>
              <select value={selectedLgaId} onChange={(e) => { const lga = lgas.find(l => l.lga_id === parseInt(e.target.value)); if (lga) handleLgaSelect(lga.lga_id.toString(), lga.lga_name, lga.lat, lga.lng); }} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                <option value="">Select LGA</option>
                {lgas.map(l => <option key={l.lga_id} value={l.lga_id}>{l.lga_name}</option>)}
              </select>
            </div>
          )}

          {hasLocation && (
            <div className="mt-3 text-sm text-gray-700 space-y-1">
              <p>📍 LGA: {selectedLgaName}, {selectedStateName}</p>
              <div className="flex items-start gap-1 mt-2 p-2 bg-amber-50 rounded-md text-xs text-amber-700">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" /><span>Your location will be locked after setup. You can change it once every 30 days for free, or pay 5000 Nicoin to change earlier. Make sure this is your exact service address.</span>
              </div>
            </div>
          )}

          {/* Optional map picker */}
          <button type="button" onClick={() => setMapExpanded(!mapExpanded)} className="mt-3 flex items-center gap-1 text-sm text-primary-600 hover:underline">
            <MapPin className="h-4 w-4" /> {mapExpanded ? 'Hide map' : 'Fine-tune on map (optional)'} <ChevronDown className={`h-4 w-4 transition ${mapExpanded ? 'rotate-180' : ''}`} />
          </button>
          {mapExpanded && (
            <button type="button" onClick={() => setShowLocationPicker(true)} className="w-full p-3 mt-2 border-2 border-dashed border-primary-300 rounded-lg bg-primary-50 hover:bg-primary-100 transition flex items-center justify-center gap-2">
              <MapPin className="h-5 w-5 text-primary-600" /><span className="text-primary-700 font-medium">{hasLocation ? 'Change Location on Map' : 'Click to set your exact location on the map'}</span>
            </button>
          )}

          <div className="mb-4 mt-4"><label className="block text-sm font-medium text-gray-700 mb-1"><Home className="inline h-4 w-4 mr-1" />Street Address (House number & street) *</label><input type="text" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500" placeholder="e.g., 15 Adeola Odeku Street" /></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1"><Landmark className="inline h-4 w-4 mr-1" />Nearest Landmark (optional)</label><input type="text" value={landmark} onChange={(e) => setLandmark(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g., Near First Bank" /></div>
        </div>

        {/* ===== CONTACT ===== */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Phone className="h-5 w-5 text-primary-600" />Contact Information</h2>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label><input type="tel" value={phoneNumber} onChange={handlePhoneChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="+234 123 456 7890" maxLength={14} />{phoneError && <p className="mt-1 text-xs text-red-600">{phoneError}</p>}<p className="mt-1 text-xs text-gray-500">10‑digit Nigerian number</p></div>
        </div>

        {/* ===== BUSINESS INFO ===== */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Store className="h-5 w-5 text-primary-600" />Business Information</h2>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label><input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g., Ade's Auto Repair" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Describe your services..." /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Service Tier *</label><select value={selectedTier} onChange={(e) => setSelectedTier(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>{TIERS.map(tier => <option key={tier.slug} value={tier.slug}>{tier.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" required disabled={categories.length === 0}><option value="">Select Category</option>{categories.map(cat => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Subcategory *</label><select value={selectedSubcategoryId} onChange={(e) => setSelectedSubcategoryId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" required disabled={subcategories.length === 0}><option value="">Select Subcategory</option>{subcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}</select></div>
          </div>
        </div>

        {/* ===== TERMS ===== */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <label className="flex items-start gap-3 cursor-pointer"><input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 h-4 w-4 text-primary-600 rounded" /><span className="text-sm text-gray-700">I agree to the <Link href="/terms" target="_blank" className="text-primary-600 hover:underline">Terms of Service</Link> and <Link href="/cookies" target="_blank" className="text-primary-600 hover:underline">Cookie Policy</Link> *</span></label>
        </div>

        {submitError && <div className="bg-red-50 border border-red-200 rounded-lg p-4"><p className="text-red-800 text-sm">{submitError}</p><button type="button" onClick={handleSubmit} className="mt-2 text-red-600 underline">Retry</button></div>}

        <div className="flex justify-end"><button type="submit" disabled={loading || !hasLocation || !termsAccepted} className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">{loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Setting up...</> : <><Save className="h-5 w-5" /> Complete Setup</>}</button></div>
      </form>

      <LocationPickerModal isOpen={showLocationPicker} onClose={() => setShowLocationPicker(false)} onLocationSelected={(data) => { setSelectedLgaId(data.lgaId.toString()); setSelectedLgaName(data.lgaName); setSelectedStateName(data.stateName); setMapLat(data.lat); setMapLng(data.lng); setDetectedArea(data.area); setHasLocation(true); toast.success(`Location set to ${data.lgaName}, ${data.stateName}${data.area ? `, ${data.area}` : ''}`); }} currentLat={mapLat} currentLng={mapLng} />
    </div>
  );
}