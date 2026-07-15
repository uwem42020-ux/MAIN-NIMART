// src/components/map/MapView.tsx
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GoogleMap, Marker, InfoWindow, OverlayView, useJsApiLoader } from '@react-google-maps/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { calculateDistance } from '@/lib/distance';
import { Search, X, LocateFixed, Maximize2, Minimize2, Map as MapIcon, List, Satellite } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Database } from '@/types/database';

type ProviderRow = Database['public']['Tables']['providers']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

interface MapProvider extends ProviderRow {
  profile: ProfileRow | null;
  distance?: number;
  display_lat?: number;
  display_lng?: number;
}

const containerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 9.0765, lng: 7.3986 };
const nigeriaBounds = {
  north: 14.0,
  south: 4.0,
  east: 15.0,
  west: 2.0,
};

const statusColors: Record<string, string> = {
  available: '#22c55e',
  busy: '#eab308',
  away: '#ef4444',
};

// ── Pulsing user location overlay ──
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

// ── Provider marker overlay: clickable, coloured circle + tiny robot ──
function ProviderMarkerOverlay({
  position,
  status,
  onClick,
}: {
  position: google.maps.LatLngLiteral;
  status: string;
  onClick: () => void;
}) {
  const color = statusColors[status] || '#6b7280';
  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={() => ({ x: -14, y: -30 })}
    >
      <div className="flex flex-col items-center cursor-pointer" onClick={onClick}>
        <div
          className="w-4 h-4 rounded-full border-2 border-white shadow-md"
          style={{ backgroundColor: color }}
        />
        <img
          src="/robot-marker.png"
          alt=""
          className="w-6 h-6 mt-0.5 object-contain"
          style={{ imageRendering: 'auto' }}
        />
      </div>
    </OverlayView>
  );
}

export function MapView() {
  const { profile } = useAuth();
  const mapRef = useRef<google.maps.Map | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  const [selectedProvider, setSelectedProvider] = useState<MapProvider | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showProviderList, setShowProviderList] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');

  const [states, setStates] = useState<any[]>([]);
  const [lgas, setLgas] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedLga, setSelectedLga] = useState('');

  const [allLgaCenters, setAllLgaCenters] = useState<any[]>([]);

  // Smooth fly‑to
  const flyTo = useCallback((lat: number, lng: number, zoom: number) => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    if (!currentCenter || currentZoom === undefined) {
      map.setCenter({ lat, lng });
      map.setZoom(zoom);
      return;
    }
    const duration = 800;
    const frames = 60;
    const stepDuration = duration / frames;
    const startLat = currentCenter.lat();
    const startLng = currentCenter.lng();
    const startZoom = currentZoom;
    let frame = 0;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const animate = () => {
      frame++;
      const progress = easeOutCubic(Math.min(frame / frames, 1));
      map.setCenter({
        lat: startLat + (lat - startLat) * progress,
        lng: startLng + (lng - startLng) * progress,
      });
      map.setZoom(startZoom + (zoom - startZoom) * progress);
      if (frame < frames) setTimeout(animate, stepDuration);
    };
    animate();
  }, []);

  // Fetch all LGA centers
  useEffect(() => {
    supabase
      .from('lga_centers')
      .select('state_id, state_name, lga_id, lga_name, lat, lng')
      .then(({ data }) => {
        if (data) setAllLgaCenters(data);
      });
  }, []);

  // Fetch states
  useEffect(() => {
    supabase
      .from('lga_centers')
      .select('state_id, state_name')
      .order('state_name')
      .then(({ data }) => {
        if (data) {
          const unique = data.filter((v, i, a) => a.findIndex(t => t.state_id === v.state_id) === i);
          setStates(unique);
        }
      });
  }, []);

  // Auto‑detect user location
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        if (allLgaCenters.length > 0) {
          let nearest = null;
          let minDist = Infinity;
          allLgaCenters.forEach((lga) => {
            const dist = calculateDistance(loc.lat, loc.lng, lga.lat, lga.lng);
            if (dist < minDist) {
              minDist = dist;
              nearest = lga;
            }
          });
          if (nearest) {
            setSelectedState(nearest.state_id.toString());
            pendingLgaRef.current = nearest.lga_id.toString();
          }
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [allLgaCenters]);

  const pendingLgaRef = useRef<string | null>(null);

  // Fetch LGAs when state changes
  useEffect(() => {
    if (!selectedState) {
      setLgas([]);
      setSelectedLga('');
      if (mapRef.current) flyTo(defaultCenter.lat, defaultCenter.lng, 7);
      return;
    }
    supabase
      .from('lga_centers')
      .select('lga_id, lga_name, lat, lng')
      .eq('state_id', parseInt(selectedState))
      .order('lga_name')
      .then(({ data }) => {
        const fetched = data || [];
        setLgas(fetched);

        if (pendingLgaRef.current && fetched.some(l => l.lga_id.toString() === pendingLgaRef.current)) {
          const targetLga = fetched.find(l => l.lga_id.toString() === pendingLgaRef.current);
          setSelectedLga(pendingLgaRef.current);
          if (targetLga?.lat != null && targetLga?.lng != null) flyTo(targetLga.lat, targetLga.lng, 14);
          pendingLgaRef.current = null;
        } else if (fetched.length > 0 && !selectedLga) {
          const firstLga = fetched[0];
          setSelectedLga(firstLga.lga_id.toString());
          if (firstLga.lat != null && firstLga.lng != null) flyTo(firstLga.lat, firstLga.lng, 14);
        }
      });
  }, [selectedState, flyTo, selectedLga]);

  const handleLgaSelect = useCallback((lgaId: number) => {
    setSelectedLga(lgaId.toString());
    const lga = lgas.find(l => l.lga_id === lgaId);
    if (lga?.lat != null && lga?.lng != null) flyTo(lga.lat, lga.lng, 14);
  }, [lgas, flyTo]);

  // Query providers
  const { data: allProviders, isLoading } = useQuery({
    queryKey: ['map-providers', userLocation?.lat, userLocation?.lng],
    queryFn: async () => {
      const { data: providers, error } = await supabase
        .from('providers')
        .select('*')
        .eq('is_available', true)
        .limit(200);
      if (error) throw error;
      if (!providers?.length) return [];

      const ids = providers.map(p => p.id);
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids);
      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      return providers.map(provider => {
        const p = profileMap.get(provider.id) || null;
        const distance = userLocation && p?.lat != null && p?.lng != null
          ? calculateDistance(userLocation.lat, userLocation.lng, p.lat, p.lng)
          : undefined;
        return { ...provider, profile: p, distance } as MapProvider;
      });
    },
    staleTime: 1000 * 60 * 5,
  });

  // Filter + spread coordinates
  const providersWithCoords = useMemo(() => {
    let filtered = (allProviders || []).filter(p => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          p.business_name?.toLowerCase().includes(term) ||
          p.profile?.full_name?.toLowerCase().includes(term) ||
          p.selected_category_slug?.toLowerCase().includes(term)
        );
      }
      if (selectedState && selectedLga && p.profile?.lga_id?.toString() !== selectedLga) return false;
      return p.profile?.lat != null && p.profile?.lng != null;
    });

    const groups = new Map<string, MapProvider[]>();
    filtered.forEach(p => {
      const key = `${p.profile!.lat},${p.profile!.lng}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    });

    const result: MapProvider[] = [];
    groups.forEach(providers => {
      if (providers.length === 1) {
        const lat = Number(providers[0].profile!.lat!);
        const lng = Number(providers[0].profile!.lng!);
        result.push({ ...providers[0], display_lat: lat, display_lng: lng });
      } else {
        providers.forEach((p, idx) => {
          const angle = (2 * Math.PI * idx) / providers.length;
          const offset = 0.002;
          const lat = Number(p.profile!.lat!) + offset * Math.cos(angle);
          const lng = Number(p.profile!.lng!) + offset * Math.sin(angle);
          result.push({ ...p, display_lat: lat, display_lng: lng });
        });
      }
    });
    return result;
  }, [allProviders, searchTerm, selectedLga, selectedState]);

  const selectedLgaName = useMemo(() => {
    if (!selectedLga) return null;
    const lga = lgas.find(l => l.lga_id.toString() === selectedLga);
    return lga?.lga_name || null;
  }, [selectedLga, lgas]);

  const handleLocate = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    toast.loading('Getting your location...', { id: 'locate' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        flyTo(loc.lat, loc.lng, 16);
        toast.success('Location found', { id: 'locate' });
      },
      (err) => {
        let message = 'Unable to get your location. ';
        if (err.code === 1) message += 'Please allow location access.';
        else if (err.code === 2) message += 'Location unavailable.';
        else if (err.code === 3) message += 'Request timed out.';
        toast.error(message, { id: 'locate' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleMapType = () => {
    setMapType(prev => (prev === 'roadmap' ? 'hybrid' : 'roadmap'));
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-64px-56px)] md:h-[calc(100dvh-64px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className={cn(
      'relative',
      isFullscreen
        ? 'fixed inset-0 z-50 h-screen'
        : 'h-[calc(100dvh-64px-56px)] md:h-[calc(100dvh-64px)]'
    )}>
      {/* Top bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex gap-2 items-stretch">
        <div className="flex-1 relative max-w-[200px] sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search…"
            className="w-full h-full pl-9 pr-8 py-2.5 bg-white/80 backdrop-blur-md rounded-lg shadow-lg border border-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-1">
          <div className="relative">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="appearance-none h-full text-xs bg-white/15 backdrop-blur-md border-0 shadow-lg rounded-lg px-3 py-2.5 pr-6 w-[110px] sm:w-[140px] text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
            >
              <option value="" className="text-gray-900">Nigeria</option>
              {states.map(s => (
                <option key={s.state_id} value={s.state_id} className="text-gray-900">{s.state_name}</option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-3 h-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {selectedState && (
            <div className="relative">
              <select
                value={selectedLga}
                onChange={(e) => handleLgaSelect(parseInt(e.target.value))}
                className="appearance-none h-full text-xs bg-white/15 backdrop-blur-md border-0 shadow-lg rounded-lg px-3 py-2.5 pr-6 w-[110px] sm:w-[140px] text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
              >
                <option value="" className="text-gray-500">LGA</option>
                {lgas.map(l => (
                  <option key={l.lga_id} value={l.lga_id} className="text-gray-900">{l.lga_name}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-3 h-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right control buttons */}
      <div className="absolute top-20 right-3 z-10 flex flex-col gap-2">
        <button onClick={() => setIsFullscreen(!isFullscreen)} className="bg-white/80 backdrop-blur-md p-2.5 rounded-lg shadow-lg border border-white/30">
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
        <button onClick={() => setShowProviderList(!showProviderList)} className="bg-white/80 backdrop-blur-md p-2.5 rounded-lg shadow-lg border border-white/30">
          {showProviderList ? <MapIcon className="h-4 w-4" /> : <List className="h-4 w-4" />}
        </button>
        <button onClick={handleLocate} className="bg-white/80 backdrop-blur-md p-2.5 rounded-lg shadow-lg border border-white/30 hover:bg-white/60 transition">
          <LocateFixed className="h-4 w-4 text-primary-600" />
        </button>
        <button onClick={toggleMapType} className="bg-white/80 backdrop-blur-md p-2.5 rounded-lg shadow-lg border border-white/30 hover:bg-white/60 transition">
          <Satellite className="h-4 w-4 text-gray-700" />
        </button>
      </div>

      {/* Map & sidebar */}
      <div className="flex h-full">
        <div className={cn('flex-1 relative', !showProviderList && 'w-full')}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={7}
            mapTypeId={mapType}
            onLoad={(map) => { mapRef.current = map; }}
            options={{
              mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || '',
              restriction: { latLngBounds: nigeriaBounds, strictBounds: false },
              minZoom: 6,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              zoomControl: false,
            }}
          >
            {userLocation && <UserLocationOverlay position={userLocation} />}

            {providersWithCoords.map(provider => (
              provider.display_lat != null && provider.display_lng != null && (
                <ProviderMarkerOverlay
                  key={provider.id}
                  position={{ lat: provider.display_lat, lng: provider.display_lng }}
                  status={provider.status}
                  onClick={() => setSelectedProvider(provider)}
                />
              )
            ))}

            {selectedProvider && (
              <InfoWindow
                key={selectedProvider.id}
                position={{
                  lat: selectedProvider.display_lat!,
                  lng: selectedProvider.display_lng!,
                }}
                onCloseClick={() => setSelectedProvider(null)}
              >
                <div className="w-56 font-sans text-sm">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {selectedProvider.business_name || selectedProvider.profile?.full_name || 'Provider'}
                  </h4>
                  <p className="text-gray-500">{selectedProvider.profile?.lga_name || ''}</p>
                  {selectedProvider.distance !== undefined && (
                    <p className="font-medium text-gray-700 mt-1">{selectedProvider.distance.toFixed(1)} km away</p>
                  )}
                  {/* Booking button – disabled if not available */}
                  <div className="mt-2 flex gap-2">
                    <a
                      href={`/provider/${selectedProvider.id}`}
                      className="flex-1 text-center bg-primary-600 text-white py-1.5 rounded-md text-xs font-medium hover:bg-primary-700"
                    >
                      View Details →
                    </a>
                    <a
                      href={selectedProvider.status === 'available' ? `/book/${selectedProvider.id}` : '#'}
                      onClick={(e) => {
                        if (selectedProvider.status !== 'available') e.preventDefault();
                      }}
                      className={cn(
                        'flex-1 text-center py-1.5 rounded-md text-xs font-medium',
                        selectedProvider.status === 'available'
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      )}
                      aria-disabled={selectedProvider.status !== 'available'}
                    >
                      {selectedProvider.status === 'available' ? 'Book Now' : 'Unavailable'}
                    </a>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>

          {/* Mobile provider count pill */}
          {!isLoading && (
            <div className="absolute bottom-4 left-4 z-10 md:hidden">
              <div className="bg-white/80 backdrop-blur-md rounded-full px-3 py-1.5 text-xs font-medium shadow-lg border border-white/30">
                {selectedLgaName
                  ? `${providersWithCoords.length} provider${providersWithCoords.length !== 1 ? 's' : ''} in ${selectedLgaName}`
                  : `${providersWithCoords.length} provider${providersWithCoords.length !== 1 ? 's' : ''} found`}
              </div>
            </div>
          )}
        </div>

        {/* Desktop sidebar */}
        {showProviderList && (
          <div className="hidden md:block w-80 border-l border-gray-200 bg-white overflow-y-auto">
            <div className="p-4 border-b sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900">
                {isLoading ? 'Searching providers…' : `${providersWithCoords.length} provider${providersWithCoords.length !== 1 ? 's' : ''} found`}
              </h3>
            </div>
            <div className="p-3 space-y-3">
              {isLoading ? (
                <div className="space-y-2">{Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div>
              ) : (
                providersWithCoords.map(provider => (
                  <button
                    key={provider.id}
                    onClick={() => {
                      setSelectedProvider(provider);
                      if (provider.display_lat != null && provider.display_lng != null) {
                        flyTo(provider.display_lat, provider.display_lng, 17);
                      }
                    }}
                    className={cn('w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition', selectedProvider?.id === provider.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                        {provider.profile?.avatar_url ? (
                          <img src={provider.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-primary-600 bg-primary-50">
                            {(provider.business_name || 'P')[0]}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {provider.business_name || provider.profile?.full_name || 'Unnamed'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {provider.profile?.lga_name || 'Location not set'}
                          {provider.distance !== undefined && ` • ${provider.distance.toFixed(1)} km`}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}