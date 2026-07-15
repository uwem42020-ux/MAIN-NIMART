// src/components/provider/LocationPickerModal.tsx
import { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { MapPin, X, LocateFixed, Loader2, Search } from 'lucide-react';

const containerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 9.0556, lng: 7.4914 };

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelected: (data: {
    lat: number;
    lng: number;
    lgaId: number;
    lgaName: string;
    stateName: string;
    area: string;
  }) => void;
  currentLat: number;
  currentLng: number;
}

export function LocationPickerModal({
  isOpen,
  onClose,
  onLocationSelected,
  currentLat,
  currentLng,
}: LocationPickerModalProps) {
  // ✅ Fix: use NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for Next.js
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [selectedLat, setSelectedLat] = useState(currentLat);
  const [selectedLng, setSelectedLng] = useState(currentLng);
  const [lgaInfo, setLgaInfo] = useState<{ lga_id: number; lga_name: string; state_name: string } | null>(null);
  const [area, setArea] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { isLoaded } = useJsApiLoader({
    id: 'location-picker',
    googleMapsApiKey: apiKey,
    libraries: ['places'],
  });

  // Initialize autocomplete
  useEffect(() => {
    if (!isLoaded || !searchInputRef.current) return;
    autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
      componentRestrictions: { country: 'ng' },
      fields: ['geometry', 'formatted_address'],
    });
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (place?.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setSelectedLat(lat);
        setSelectedLng(lng);
        if (mapRef.current) {
          mapRef.current.setCenter({ lat, lng });
          mapRef.current.setZoom(18);
        }
        setArea(place.formatted_address || '');
      }
    });
  }, [isLoaded]);

  // Fetch LGA when marker moves
  useEffect(() => {
    if (!selectedLat || !selectedLng) return;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('find_nearest_lga', {
          user_lat: selectedLat,
          user_lng: selectedLng,
        });
        if (error) throw error;
        if (data && data.length > 0) {
          setLgaInfo({
            lga_id: data[0].lga_id,
            lga_name: data[0].lga_name,
            state_name: data[0].state_name,
          });
        } else {
          setLgaInfo(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [selectedLat, selectedLng]);

  // Auto-detect GPS on modal open
  useEffect(() => {
    if (!isOpen || !isLoaded) return;
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (currentLat === defaultCenter.lat && currentLng === defaultCenter.lng) {
          setSelectedLat(loc.lat);
          setSelectedLng(loc.lng);
        }
        if (mapRef.current) mapRef.current.setCenter(loc);
        setGettingLocation(false);
      },
      () => setGettingLocation(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [isOpen, isLoaded]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setSelectedLat(loc.lat);
        setSelectedLng(loc.lng);
        if (mapRef.current) {
          mapRef.current.setCenter(loc);
          mapRef.current.setZoom(18);
        }
        setGettingLocation(false);
        toast.success('Map centered on your location');
      },
      () => { toast.error('Unable to get location'); setGettingLocation(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    if (!lgaInfo) { toast.error('Please select a valid location'); return; }
    if (selectedLat === defaultCenter.lat && selectedLng === defaultCenter.lng) {
      toast.error('Please move the pin to your exact location');
      return;
    }
    onLocationSelected({
      lat: selectedLat,
      lng: selectedLng,
      lgaId: lgaInfo.lga_id,
      lgaName: lgaInfo.lga_name,
      stateName: lgaInfo.state_name,
      area,
    });
    onClose();
  };

  if (!isOpen) return null;
  if (!isLoaded) return <div className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Set Your Exact Location</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-2 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search address, landmark, or area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={{ lat: selectedLat, lng: selectedLng }}
            zoom={16}
            onLoad={(map) => { mapRef.current = map; }}
            onClick={(e) => {
              if (e.latLng) {
                setSelectedLat(e.latLng.lat());
                setSelectedLng(e.latLng.lng());
              }
            }}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              zoomControl: false,
            }}
          >
            <Marker
              position={{ lat: selectedLat, lng: selectedLng }}
              draggable={true}
              onDragEnd={(e) => {
                if (e.latLng) {
                  setSelectedLat(e.latLng.lat());
                  setSelectedLng(e.latLng.lng());
                }
              }}
              icon={{
                url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="18" r="12" fill="%23008751" stroke="white" stroke-width="3"/><path d="M20 30 L20 40" stroke="%23008751" stroke-width="3"/></svg>',
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 40),
              }}
            />
          </GoogleMap>

          {/* Info overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 space-y-1">
            {loading ? (
              <div className="flex justify-center py-2"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : lgaInfo ? (
              <>
                <p className="text-sm font-medium text-gray-900">📍 {lgaInfo.lga_name}, {lgaInfo.state_name}</p>
                {area && <p className="text-xs text-gray-600">🏘️ {area}</p>}
                <p className="text-xs text-gray-500">Drag the green pin to your exact location</p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Click or drag the pin to select your service location</p>
            )}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="p-4 border-t flex justify-between items-center gap-3 flex-wrap">
          <button
            onClick={handleUseCurrentLocation}
            disabled={gettingLocation}
            className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition text-sm font-medium"
          >
            {gettingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            Use my current location
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
            <button onClick={handleConfirm} disabled={!lgaInfo} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium">Use this location</button>
          </div>
        </div>
      </div>
    </div>
  );
}