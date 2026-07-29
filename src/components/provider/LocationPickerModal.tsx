// src/components/provider/LocationPickerModal.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete, OverlayView } from '@react-google-maps/api';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import toast from 'react-hot-toast';
import {
  X, LocateFixed, Loader2, Search, ChevronDown, MapPin, Navigation
} from 'lucide-react';

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

interface StateOption {
  state_id: number;
  state_name: string;
}

interface LgaOption {
  lga_id: number;
  lga_name: string;
  state_id: number;
  lat: number;
  lng: number;
}

// ==================== Blue GPS dot overlay (reused from MapView) ====================
function UserLocationOverlay({ position }: { position: google.maps.LatLngLiteral }) {
  if (!position) return null;
  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={() => ({ x: -16, y: -16 })}
    >
      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping" />
          <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg z-10" />
        </div>
      </div>
    </OverlayView>
  );
}
// =================================================================================

export function LocationPickerModal({
  isOpen,
  onClose,
  onLocationSelected,
  currentLat,
  currentLng,
}: LocationPickerModalProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Location state
  const [selectedLat, setSelectedLat] = useState(currentLat);
  const [selectedLng, setSelectedLng] = useState(currentLng);
  const [lgaInfo, setLgaInfo] = useState<{ lga_id: number; lga_name: string; state_name: string } | null>(null);
  const [area, setArea] = useState<string>('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [gettingCurrentLocation, setGettingCurrentLocation] = useState(false);

  // Blue dot state – holds the actual GPS location separately from the draggable pin
  const [userPosition, setUserPosition] = useState<google.maps.LatLngLiteral | null>(null);

  // Dropdown data
  const [states, setStates] = useState<StateOption[]>([]);
  const [lgas, setLgas] = useState<LgaOption[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [selectedLgaId, setSelectedLgaId] = useState<number | null>(null);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingLgas, setLoadingLgas] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  // Load map & places library
  const { isLoaded } = useJsApiLoader({
    id: 'location-picker',
    googleMapsApiKey: apiKey,
    libraries: ['places'],
  });

  // Fetch states on mount
  useEffect(() => {
    const fetchStates = async () => {
      setLoadingStates(true);
      const { data, error } = await supabase
        .from('lga_centers')
        .select('state_id, state_name')
        .order('state_name');
      if (error) {
        toast.error('Failed to load states');
        setLoadingStates(false);
        return;
      }
      const unique = (data as any[]).filter(
        (v: any, i: number, a: any[]) =>
          a.findIndex((t: any) => t.state_id === v.state_id) === i
      ) as StateOption[];
      setStates(unique);
      setLoadingStates(false);
    };
    fetchStates();
  }, []);

  // Fetch LGAs when state changes
  useEffect(() => {
    if (!selectedStateId) {
      setLgas([]);
      return;
    }
    const fetchLgas = async () => {
      setLoadingLgas(true);
      const { data, error } = await supabase
        .from('lga_centers')
        .select('lga_id, lga_name, state_id, lat, lng')
        .eq('state_id', selectedStateId)
        .order('lga_name');
      if (error) {
        toast.error('Failed to load LGAs');
        setLoadingLgas(false);
        return;
      }
      setLgas(data as LgaOption[]);
      setLoadingLgas(false);
    };
    fetchLgas();
  }, [selectedStateId]);

  // When LGA is selected from dropdown
  const handleLgaSelect = useCallback(
    (lgaId: number) => {
      setSelectedLgaId(lgaId);
      const lga = lgas.find((l) => l.lga_id === lgaId);
      if (lga) {
        const newLat = lga.lat || defaultCenter.lat;
        const newLng = lga.lng || defaultCenter.lng;
        setSelectedLat(newLat);
        setSelectedLng(newLng);
        setLgaInfo({
          lga_id: lga.lga_id,
          lga_name: lga.lga_name,
          state_name: states.find((s) => s.state_id === selectedStateId)?.state_name || '',
        });
        setArea(`${lga.lga_name}, ${states.find((s) => s.state_id === selectedStateId)?.state_name || ''}`);
        if (mapRef.current) {
          mapRef.current.setCenter({ lat: newLat, lng: newLng });
          mapRef.current.setZoom(14);
        }
        setManualMode(true);
      }
    },
    [lgas, selectedStateId, states]
  );

  // Auto‑detect GPS on modal open (only if not manually set)
  useEffect(() => {
    if (!isOpen || !isLoaded) return;
    if (manualMode) return;
    if (!navigator.geolocation) return;
    setGettingCurrentLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        // Update blue dot
        setUserPosition(loc);
        // If still at default, move the draggable pin to user location
        if (currentLat === defaultCenter.lat && currentLng === defaultCenter.lng) {
          setSelectedLat(loc.lat);
          setSelectedLng(loc.lng);
        }
        if (mapRef.current) mapRef.current.setCenter(loc);
        setGettingCurrentLocation(false);
      },
      () => setGettingCurrentLocation(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [isOpen, isLoaded, manualMode, currentLat, currentLng]);

  // Fetch LGA details when marker is moved (for manual pin drag or click)
  useEffect(() => {
    if (!selectedLat || !selectedLng) return;
    const fetchDetails = async () => {
      setLoadingLocation(true);
      try {
        const { data, error } = await db.rpc('find_nearest_lga', {
          user_lat: selectedLat,
          user_lng: selectedLng,
        } as any);
        if (error) throw error;
        if (data && (data as any[]).length > 0) {
          const d = (data as any[])[0];
          setLgaInfo({
            lga_id: d.lga_id,
            lga_name: d.lga_name,
            state_name: d.state_name,
          });
          setArea(`${d.lga_name}, ${d.state_name}`);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingLocation(false);
      }
    };
    fetchDetails();
  }, [selectedLat, selectedLng, manualMode]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    setGettingCurrentLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPosition(loc);
        setSelectedLat(loc.lat);
        setSelectedLng(loc.lng);
        if (mapRef.current) {
          mapRef.current.setCenter(loc);
          mapRef.current.setZoom(18);
        }
        setGettingCurrentLocation(false);
        toast.success('Map centered on your location');
        setManualMode(false);
      },
      () => {
        toast.error('Unable to get location');
        setGettingCurrentLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ----- Places Autocomplete handler -----
  const onPlaceSelected = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place || !place.geometry?.location) {
      toast.error('Please select a location from the suggestions');
      return;
    }
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    setSelectedLat(lat);
    setSelectedLng(lng);
    if (mapRef.current) {
      mapRef.current.setCenter({ lat, lng });
      mapRef.current.setZoom(16);
    }
    setManualMode(false); // let the LGA detection run
    // Optionally clear the dropdowns to avoid confusion
    setSelectedStateId(null);
    setSelectedLgaId(null);
    // Clear the search input
    if (searchInputRef.current) searchInputRef.current.value = '';
  }, []);

  const handleConfirm = () => {
    if (!lgaInfo) {
      toast.error('Please select a valid location');
      return;
    }
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
  if (!isLoaded)
    return (
      <div className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );

  return (
    <div className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Set Your Exact Location</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search + State/LGA selectors */}
        <div className="p-4 border-b bg-gray-50/50">
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            {/* Places search input */}
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search for a place</label>
              {isLoaded && (
                <Autocomplete
                  onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                  onPlaceChanged={onPlaceSelected}
                  options={{
                    componentRestrictions: { country: 'ng' },
                    fields: ['geometry', 'name', 'address_components'],
                    types: ['geocode'],
                  }}
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="e.g. Lagos, Ikeja, or an address..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </Autocomplete>
              )}
            </div>

            {/* State dropdown */}
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <div className="relative">
                <select
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white appearance-none cursor-pointer text-sm disabled:opacity-50"
                  disabled={loadingStates}
                  value={selectedStateId ?? ''}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    setSelectedStateId(id);
                    setSelectedLgaId(null);
                    setLgas([]);
                    setLgaInfo(null);
                  }}
                >
                  <option value="">Select a state…</option>
                  {states.map((s) => (
                    <option key={s.state_id} value={s.state_id}>
                      {s.state_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* LGA dropdown */}
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">LGA</label>
              <div className="relative">
                <select
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white appearance-none cursor-pointer text-sm disabled:opacity-50"
                  disabled={!selectedStateId || loadingLgas}
                  value={selectedLgaId ?? ''}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    if (id) handleLgaSelect(id);
                  }}
                >
                  <option value="">Select an LGA…</option>
                  {lgas.map((l) => (
                    <option key={l.lga_id} value={l.lga_id}>
                      {l.lga_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Use my location button */}
            <button
              onClick={handleUseCurrentLocation}
              disabled={gettingCurrentLocation}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition text-sm font-medium whitespace-nowrap disabled:opacity-50 mt-5 sm:mt-0"
            >
              {gettingCurrentLocation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              Use my location
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={{ lat: selectedLat, lng: selectedLng }}
            zoom={16}
            onLoad={(map) => {
              mapRef.current = map;
            }}
            onClick={(e) => {
              if (e.latLng) {
                setSelectedLat(e.latLng.lat());
                setSelectedLng(e.latLng.lng());
                setManualMode(false);
              }
            }}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              zoomControl: false,
            }}
          >
            {/* Blue GPS dot (pulsing) */}
            {userPosition && <UserLocationOverlay position={userPosition} />}

            {/* Draggable green pin */}
            <Marker
              position={{ lat: selectedLat, lng: selectedLng }}
              draggable={true}
              onDragEnd={(e) => {
                if (e.latLng) {
                  setSelectedLat(e.latLng.lat());
                  setSelectedLng(e.latLng.lng());
                  setManualMode(false);
                }
              }}
              icon={{
                url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="18" r="12" fill="%23008751" stroke="white" stroke-width="3"/><path d="M20 30 L20 40" stroke="%23008751" stroke-width="3"/></svg>',
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 40),
              }}
            />
          </GoogleMap>

          {/* Location info overlay */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-[250px] z-10">
            {loadingLocation ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Finding LGA…
              </div>
            ) : lgaInfo ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary-600 flex-shrink-0" />
                  {lgaInfo.lga_name}, {lgaInfo.state_name}
                </p>
                {area && (
                  <p className="text-xs text-gray-600 break-words">{area}</p>
                )}
                <p className="text-xs text-gray-400">
                  Drag the pin to fine‑tune
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Click the map or drag the pin to select your service location
              </p>
            )}
          </div>

          {/* Getting location spinner */}
          {gettingCurrentLocation && (
            <div className="absolute top-4 left-4 bg-white/90 rounded-lg shadow p-2 flex items-center gap-2 z-10">
              <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
              <span className="text-xs">Getting your location…</span>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="p-4 border-t flex justify-between items-center gap-3 flex-wrap">
          <p className="text-xs text-gray-500 hidden sm:block">
            Search for a place, or use the dropdowns and drag the pin
          </p>
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!lgaInfo}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
            >
              Use this location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}