// src/app/customer/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { upgradeToProvider } from '@/lib/upgradeProvider';
import { compressImage } from '@/lib/imageUtils';
import { SetPasswordForm } from '@/components/profile/SetPasswordForm';
import toast from 'react-hot-toast';
import { User, Phone, Save, Camera, Briefcase, ArrowRight } from 'lucide-react';

export default function CustomerProfile() {
  const router = useRouter();
  const { user, profile, updateProfile, refreshProfile, isProvider } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const compressedFile = await compressImage(file);

      const fileName = `${user!.id}/${user!.id}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const newAvatarUrl = urlData.publicUrl;

      await updateProfile({ avatar_url: newAvatarUrl });
      setAvatarUrl(newAvatarUrl);
      toast.success('Profile picture updated');
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName, phone });
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBecomeProvider = async () => {
    if (!user) return;
    if (!window.confirm(
      'Become a provider?\n\nYou will keep your email and account. You\'ll just need to complete your business profile to appear on the map and search results.'
    )) return;

    setSwitching(true);
    try {
      const result = await upgradeToProvider(user.id, isProvider, refreshProfile);
      if (!result.ok) {
        throw new Error(result.error || 'Something went wrong. Please try again.');
      }
      toast.success('You are now a provider! Complete your business profile.');
      router.push('/provider/setup');
    } catch (err: any) {
      toast.error(err.message || 'Failed to switch. Please try again.');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>

      {/* Provider upgrade card - hidden once user is a provider */}
      {!isProvider && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-primary-900 mb-1">
                Want to earn on Nimart too?
              </h2>
              <p className="text-sm text-primary-800 mb-3">
                Offer your services to customers in your area. Set your own
                prices, control your schedule, and get paid.
              </p>
              <button
                onClick={handleBecomeProvider}
                disabled={switching}
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition"
              >
                {switching ? 'Setting up...' : (
                  <>
                    Become a provider <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary-600" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md cursor-pointer">
                <Camera className="h-4 w-4 text-gray-600" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{fullName || 'Your Name'}</p>
              <p className="text-xs text-gray-500">{uploading ? 'Uploading...' : 'Click the camera to change'}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="+234 123 456 7890"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <SetPasswordForm />
      </div>
    </div>
  );
}