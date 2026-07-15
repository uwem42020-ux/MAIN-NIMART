// src/app/provider/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SetPasswordForm } from '@/components/profile/SetPasswordForm';
import { LocationPickerModal } from '@/components/provider/LocationPickerModal';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import toast from 'react-hot-toast';
import {
  User, Phone, Store, FileText, Save, Camera, AlertCircle,
  Home, Landmark, Image, Languages, GraduationCap, Calendar,
  CheckCircle, Loader2, MapPin
} from 'lucide-react';

export default function ProviderProfile() {
  const router = useRouter();
  const { user, profile, updateProfile, refreshProfile } = useAuth();

  // --- Setup‑filled fields (read‑only) ---
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [addressArea, setAddressArea] = useState('');
  const [fullName, setFullName] = useState('');
  const [description, setDescription] = useState('');
  const [lgaName, setLgaName] = useState('');
  const [stateName, setStateName] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // --- Profile‑specific fields (editable) ---
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [education, setEducation] = useState('');
  const [languages, setLanguages] = useState('');

  // --- UI states ---
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(true);

  // --- Location change modal & cooldown ---
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationStatus, setLocationStatus] = useState<any>(null);
  const [cooldownTimer, setCooldownTimer] = useState<string>('');
  const [changingLocation, setChangingLocation] = useState(false);

  // Password status – now uses the database flag instead of localStorage
  const [hasPassword, setHasPassword] = useState(false);

  // --- Helper: fetch location change status ---
  const fetchLocationStatus = async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc('get_location_change_status', { p_provider_id: user.id });
    if (error) console.error(error);
    else setLocationStatus(data);
  };

  // --- Fetch provider data on mount ---
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Provider business info
      const { data: providerData } = await supabase
        .from('providers')
        .select('business_name, description')
        .eq('id', user.id)
        .single();
      if (providerData) {
        setBusinessName(providerData.business_name || '');
        setDescription(providerData.description || '');
      }

      // Profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileData) {
        setFullName(profileData.full_name || '');
        setPhone(profileData.phone || '');
        setStreetAddress(profileData.street_address || '');
        setLandmark(profileData.landmark || '');
        setAddressArea(profileData.address_area || '');
        setAvatarUrl(profileData.avatar_url);
        setCoverPhoto(profileData.cover_photo);
        setGender(profileData.gender || '');
        setAge(profileData.age ? String(profileData.age) : '');
        setEducation(profileData.education || '');
        setLanguages(profileData.languages || '');
        setLgaName(profileData.lga_name || '');
        setLat(profileData.lat);
        setLng(profileData.lng);
        // Password flag from database
        setHasPassword(profileData.has_password || false);

        // Get state name from lga_centers if not directly stored
        if (profileData.lga_id && !profileData.state_name) {
          const { data: lgaInfo } = await supabase
            .from('lga_centers')
            .select('state_name')
            .eq('lga_id', profileData.lga_id)
            .single();
          if (lgaInfo) setStateName(lgaInfo.state_name);
        } else {
          setStateName(profileData.state_name || '');
        }
      }

      // Check if setup is incomplete
      if (!providerData?.business_name || !profileData?.lga_id || !profileData?.street_address) {
        setIsSetupComplete(false);
      }

      setInitialDataLoaded(true);
    };

    fetchData();
    fetchLocationStatus();
  }, [user]);

  // --- Cooldown timer effect ---
  useEffect(() => {
    if (!locationStatus || locationStatus.free_available) {
      setCooldownTimer('');
      return;
    }
    const interval = setInterval(() => {
      const nextDate = new Date(locationStatus.next_free_date);
      const now = new Date();
      const diff = nextDate.getTime() - now.getTime();
      if (diff <= 0) {
        setCooldownTimer('Available now');
        fetchLocationStatus();
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % 86400000) / 3600000);
        setCooldownTimer(`${days}d ${hours}h`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [locationStatus]);

  // --- Phone validation ---
  const validatePhoneNumber = (phoneNumber: string): boolean => {
    const local = phoneNumber.replace('+234', '');
    const isValid = /^\d{10}$/.test(local);
    setPhoneError(isValid ? '' : 'Enter a valid 10-digit Nigerian phone number');
    return isValid;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+234')) val = '+234' + val.replace(/\D/g, '');
    const digits = val.slice(4).replace(/\D/g, '').slice(0, 10);
    const final = '+234' + digits;
    setPhone(final);
    if (digits.length === 10) validatePhoneNumber(final);
    else setPhoneError('');
  };

  // --- Avatar upload ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/avatar-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await updateProfile({ avatar_url: urlData.publicUrl });
      setAvatarUrl(urlData.publicUrl);
      toast.success('Profile picture uploaded');
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // --- Cover photo upload ---
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/cover-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await updateProfile({ cover_photo: urlData.publicUrl });
      setCoverPhoto(urlData.publicUrl);
      toast.success('Cover photo updated');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploadingCover(false);
    }
  };

  // --- Final save (profile completion) ---
  const handleFinalSubmit = async () => {
    if (!avatarUrl) {
      toast.error('Please upload a profile picture before continuing.');
      return;
    }
    if (!hasPassword) {
      toast.error('Please set a password for your account.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ is_complete: true });
      await refreshProfile();
      toast.success('Profile completed! Redirecting to dashboard...');
      router.push('/provider/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  // --- Location change handler ---
  const handleLocationChange = async (data: {
    lat: number;
    lng: number;
    lgaId: number;
    lgaName: string;
    stateName: string;
    area: string;
  }) => {
    setChangingLocation(true);
    try {
      let rpcName: string;
      let params: any = {
        p_provider_id: user!.id,
        p_new_lat: data.lat,
        p_new_lng: data.lng,
        p_new_lga_id: data.lgaId,
        p_new_lga_name: data.lgaName,
        p_new_address_area: data.area,
      };

      if (locationStatus?.free_available) {
        rpcName = 'change_location_free';
      } else if (locationStatus?.paid_possible) {
        rpcName = 'change_location_paid';
        params.p_cost = 5000;
      } else {
        toast.error('No change option available. Please check your cooldown or Nicoin balance.');
        return;
      }

      const { data: result, error } = await supabase.rpc(rpcName, params);
      if (error) throw error;
      if (!result.success) throw new Error(result.error);

      toast.success(rpcName === 'change_location_free' ? 'Location updated (free)' : 'Location updated (5000 Nicoin deducted)');
      await refreshProfile();
      fetchLocationStatus();
      setLgaName(data.lgaName);
      setStateName(data.stateName);
      setAddressArea(data.area);
      setLat(data.lat);
      setLng(data.lng);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChangingLocation(false);
    }
  };

  if (!initialDataLoaded || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NimartSpinner size="md" />
      </div>
    );
  }

  if (!isSetupComplete) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">You haven't completed the basic setup. Please finish it first.</p>
          <Link href="/provider/setup" className="mt-2 inline-block text-primary-600 underline">Go to Setup</Link>
        </div>
      </div>
    );
  }

  const showWarning = !avatarUrl || !hasPassword;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
      <p className="text-gray-600 mb-6">
        Please upload a profile picture and set a password to activate your account.
      </p>

      {showWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Action required</p>
            <ul className="text-sm text-amber-700 mt-1 list-disc list-inside">
              {!avatarUrl && <li>Upload a profile picture (mandatory)</li>}
              {!hasPassword && <li>Set a password for your account</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Two‑column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Business Information (read‑only) */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information (from setup)</h2>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label><input type="text" value={businessName} disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label><input type="tel" value={phone} disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" value={fullName} disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label><input type="text" value={streetAddress} disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Area / Neighbourhood</label><input type="text" value={addressArea} disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Service Description</label><textarea value={description} disabled rows={2} className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg" /></div>
            </div>
          </div>

          {/* Service Location */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary-600" />
              Service Location
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current location:</p>
                  <p className="font-medium">{lgaName}, {stateName}</p>
                  <p className="text-sm text-gray-500">{addressArea}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {locationStatus?.free_available ? (
                      <span className="text-green-600">✅ Free change available</span>
                    ) : (
                      <span className="text-amber-600">⏳ Next free change in {cooldownTimer}</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setShowLocationPicker(true)}
                  disabled={changingLocation}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm disabled:opacity-50"
                >
                  {changingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Change Location'}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                You can change your location once every 30 days for free, or pay 5000 Nicoin to change anytime.
                {!locationStatus?.free_available && !locationStatus?.paid_possible && (
                  <span className="block text-red-600 mt-1">Insufficient Nicoin to change now. Earn more by completing bookings.</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture *</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-24 w-24 rounded-full object-cover border-2 border-primary-500" />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-12 w-12 text-primary-600" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md cursor-pointer">
                  {uploadingAvatar ? <Loader2 className="h-5 w-5 text-primary-600 animate-spin" /> : <Camera className="h-5 w-5 text-gray-600" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                </label>
              </div>
              <div>
                <p className="text-sm text-gray-600">{uploadingAvatar ? 'Uploading...' : 'Click the camera to upload your photo'}</p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 2MB</p>
              </div>
            </div>
          </div>

          {/* Set Password */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Set a Password *</h2>
            <SetPasswordForm
              onSuccess={() => setHasPassword(true)}
              initialCompleted={hasPassword}
              userId={user?.id}
            />
          </div>

          {/* Additional Information (optional) */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information (optional)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-3 py-2 border rounded-lg"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Age</label><input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full px-3 py-2 border rounded-lg" min={16} max={100} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Education</label><input type="text" value={education} onChange={(e) => setEducation(e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Languages</label><input type="text" value={languages} onChange={(e) => setLanguages(e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
          </div>

          {/* Cover Photo (optional) */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cover Photo (optional)</h2>
            <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
              {coverPhoto ? <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><Image className="h-8 w-8" /></div>}
              <label className="absolute bottom-2 right-2 bg-white rounded-full p-1.5 shadow cursor-pointer">
                {uploadingCover ? <Loader2 className="h-4 w-4 text-primary-600 animate-spin" /> : <Camera className="h-4 w-4 text-gray-600" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Final button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={handleFinalSubmit}
          disabled={saving || !avatarUrl || !hasPassword}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <><Loader2 className="h-5 w-5 animate-spin" /> Saving...</> : <><Save className="h-5 w-5" /> Complete & Go to Dashboard</>}
        </button>
      </div>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelected={handleLocationChange}
        currentLat={lat || 9.0556}
        currentLng={lng || 7.4914}
      />
    </div>
  );
}