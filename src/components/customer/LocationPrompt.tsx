// src/components/customer/LocationPrompt.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, X } from 'lucide-react';
import toast from 'react-hot-toast';

export function LocationPrompt() {
  const { user, profile, refreshProfile } = useAuth();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [lgas, setLgas] = useState<any[]>([]);
  const [selectedLga, setSelectedLga] = useState('');

  useEffect(() => {
    // Show if customer and no location set
    if (profile && profile.role === 'customer' && !profile.lat && !profile.lng) {
      setShow(true);
      fetchStates();
    }
  }, [profile]);

  async function fetchStates() {
    const { data } = await supabase.from('lga_centers').select('state_id, state_name').order('state_name');
    const unique = data?.filter((v, i, a) => a.findIndex(t => t.state_id === v.state_id) === i) || [];
    setStates(unique);
  }

  async function handleStateChange(stateId: string) {
    setSelectedState(stateId);
    const { data } = await supabase.from('lga_centers').select('lga_id, lga_name').eq('state_id', parseInt(stateId)).order('lga_name');
    setLgas(data || []);
    setSelectedLga('');
  }

  async function saveLocation() {
    if (!selectedLga) {
      toast.error('Please select your LGA');
      return;
    }
    setLoading(true);
    const lga = lgas.find(l => l.lga_id.toString() === selectedLga);
    const { data: coords } = await supabase.from('lga_centers').select('lat, lng').eq('lga_id', parseInt(selectedLga)).single();
    const { error } = await supabase.from('profiles').update({
      lga_id: parseInt(selectedLga),
      lga_name: lga?.lga_name,
      lat: coords?.lat,
      lng: coords?.lng,
    }).eq('id', user!.id);
    if (error) toast.error(error.message);
    else {
      toast.success('Location saved!');
      await refreshProfile();
      setShow(false);
    }
    setLoading(false);
  }

  async function useGeolocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const { error } = await supabase.from('profiles').update({
        lat: latitude,
        lng: longitude,
      }).eq('id', user!.id);
      if (error) toast.error(error.message);
      else {
        toast.success('Location set via GPS');
        await refreshProfile();
        setShow(false);
      }
      setLoading(false);
    }, (err) => {
      toast.error('Location permission denied');
      setLoading(false);
    });
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Set Your Location</h2>
          <button onClick={() => setShow(false)} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">Help us show you nearby providers. Your location is never shared publicly.</p>
          <button
            onClick={useGeolocation}
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
          >
            <MapPin className="h-4 w-4" /> Use Current Location
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t"></div></div>
            <div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-gray-500">or select manually</span></div>
          </div>
          <select className="w-full p-2 border rounded" value={selectedState} onChange={(e) => handleStateChange(e.target.value)}>
            <option value="">Select State</option>
            {states.map(s => <option key={s.state_id} value={s.state_id}>{s.state_name}</option>)}
          </select>
          {selectedState && (
            <select className="w-full p-2 border rounded" value={selectedLga} onChange={(e) => setSelectedLga(e.target.value)}>
              <option value="">Select LGA</option>
              {lgas.map(l => <option key={l.lga_id} value={l.lga_id}>{l.lga_name}</option>)}
            </select>
          )}
          <div className="flex gap-3">
            <button onClick={() => setShow(false)} className="flex-1 px-4 py-2 border rounded-lg">Skip</button>
            <button onClick={saveLocation} disabled={loading || !selectedLga} className="flex-1 bg-primary-600 text-white py-2 rounded-lg disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Location'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}