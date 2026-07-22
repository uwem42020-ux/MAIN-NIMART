// src/components/map/MapView.tsx
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GoogleMap, InfoWindow, OverlayView, useJsApiLoader } from '@react-google-maps/api';
import { db } from '@/lib/supabase-any';
import { useAuth } from '@/contexts/AuthContext';
import { calculateDistance } from '@/lib/distance';
import { Search, X, LocateFixed, Maximize2, Minimize2, Map as MapIcon, List, Satellite } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type MapProvider = {
  id: string;
  business_name: string;
  status: string;
  selected_category_slug: string;
  lat: number;
  lng: number;
  avatar_url: string | null;
  lga_name: string | null;
  state_name: string | null;
  distance?: number;
};

const defaultCenter = { lat: 9.0765, lng: 7.3986 };
const nigeriaBounds = { north: 14.0, south: 4.0, east: 15.0, west: 2.0 };

const statusColors: Record<string, string> = {
  available: '#22c55e',
  busy: '#eab308',
  away: '#ef4444',
};

function UserLocationOverlay({ position }: { position: google.maps.LatLngLiteral }) {
  if (!position) return null;
  return (
    <OverlayView position={position} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} getPixelPositionOffset={() => ({ x: -16, y: -16 })}>
      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping" />
          <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg z-10" />
        </div>
      </div>
    </OverlayView>
  );
}

function ProviderMarkerOverlay({ position, status, onClick }: { position: google.maps.LatLngLiteral; status: string; onClick: () => void }) {
  const color = statusColors[status] || '#6b7280';
  return (
    <OverlayView position={position} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} getPixelPositionOffset={() => ({ x: -14, y: -30 })}>
      <div className="flex flex-col items-center cursor-pointer" onClick={onClick}>
        <div className="w-4 h-4 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: color }} />
        <img src="/robot-marker.png" alt="" className="w-6 h-6 mt-0.5 object-contain" style={{ imageRendering: 'auto' }} />
      </div>
    </OverlayView>
  );
}

export function MapView() {
  const { profile } = useAuth();
  const mapRef = useRef<google.maps.Map | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || 'MISSING_KEY',
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

  const flyTo = useCallback((lat: number, lng: number, zoom: number) => {
    if (!mapRef.current) return;
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(zoom);
  }, []);

  useEffect(() => {
    db.from('lga_centers').select('state_id, state_name').order('state_name').then(({ data }: { data: any }) => {
      if (data) {
        const unique = data.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.state_id === v.state_id) === i);
        setStates(unique);
      }
    });
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        if (mapRef.current && !selectedState) {
          flyTo(loc.lat, loc.lng, 16);
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [selectedState, flyTo]);

  useEffect(() => {
    if (!selectedState) { setLgas([]); setSelectedLga(''); return; }
    db.from('lga_centers').select('lga_id, lga_name, lat, lng').eq('state_id', parseInt(selectedState)).order('lga_name')
      .then(({ data }: { data: any }) => {
        setLgas(data || []);
        if (data?.length && !selectedLga) {
          setSelectedLga(data[0].lga_id.toString());
          if (data[0].lat != null && data[0].lng != null) flyTo(data[0].lat, data[0].lng, 14);
        }
      });
  }, [selectedState, flyTo, selectedLga]);

  const handleLgaSelect = useCallback((lgaId: number) => {
    setSelectedLga(lgaId.toString());
    const lga = lgas.find((l: any) => l.lga_id === lgaId);
    if (lga?.lat != null && lga?.lng != null) flyTo(lga.lat, lga.lng, 14);
  }, [lgas, flyTo]);

  const { data: allProviders, isLoading } = useQuery({
    queryKey: ['map-providers'],
    queryFn: async () => {
      const { data: providers, error } = await db
        .from('providers')
        .select('id, business_name, status, selected_category_slug')
        .eq('is_available', true)
        .limit(100);

      if (error || !providers) return [];

      const providerIds = (providers as any[]).map((p: any) => p.id);

      const { data: profiles } = await db
        .from('profiles')
        .select('id, lat, lng, avatar_url, lga_name, state_name')
        .in('id', providerIds);

      const profileMap = new Map((profiles as any[])?.map((p: any) => [p.id, p]) || []);

      return (providers as any[]).map((p: any) => {
        const prof = profileMap.get(p.id) || {};
        const distance = userLocation && prof?.lat != null && prof?.lng != null
          ? calculateDistance(userLocation.lat, userLocation.lng, prof.lat, prof.lng)
          : undefined;
        return {
          id: p.id,
          business_name: p.business_name,
          status: p.status,
          selected_category_slug: p.selected_category_slug,
          lat: prof.lat,
          lng: prof.lng,
          avatar_url: prof.avatar_url,
          lga_name: prof.lga_name,
          state_name: prof.state_name,
          distance,
        };
      });
    },
    staleTime: 1000 * 60 * 5,
  });

  const providersWithCoords = useMemo(() => {
    let filtered = (allProviders || []).filter((p: any) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          p.business_name?.toLowerCase().includes(term) ||
          p.selected_category_slug?.toLowerCase().includes(term) ||
          p.lga_name?.toLowerCase().includes(term)
        );
      }
      if (selectedState && selectedLga && p.lga_id?.toString() !== selectedLga) return false;
      return p.lat != null && p.lng != null;
    });
    return filtered;
  }, [allProviders, searchTerm, selectedLga, selectedState]);

  const selectedLgaName = useMemo(() => {
    if (!selectedLga) return null;
    const lga = lgas.find((l: any) => l.lga_id.toString() === selectedLga);
    return lga?.lga_name || null;
  }, [selectedLga, lgas]);

  const handleLocate = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        flyTo(loc.lat, loc.lng, 16);
      },
      () => toast.error('Unable to get location'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Show loading spinner while API key is loading
  if (!isLoaded && !loadError) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-64px-56px)] md:h-[calc(100dvh-64px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Show fallback if API key failed to load
  if (loadError || !apiKey) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-64px-56px)] md:h-[calc(100dvh-64px)]">
        <div className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-gray-500 mb-2">Map is temporarily unavailable.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary-600 hover:underline text-sm font-medium"
          >
            Tap to reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', isFullscreen ? 'fixed inset-0 z-50 h-screen' : 'h-[calc(100dvh-64px-56px)] md:h-[calc(100dvh-64px)]')}>
      {/* Top bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex gap-2 items-stretch">
        <div className="flex-1 relative max-w-[200px] sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search…"
            className="w-full h-full pl-9 pr-8 py-2.5 bg-white/80 backdrop-blur-md rounded-lg shadow-lg border border-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"><X className="h-4 w-4" /></button>}
        </div>
        <div className="flex gap-1">
          <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}
            className="appearance-none h-full text-xs bg-white/15 backdrop-blur-md border-0 shadow-lg rounded-lg px-3 py-2.5 pr-6 w-[110px] sm:w-[140px] text-gray-900 font-medium cursor-pointer">
            <option value="">Nigeria</option>
            {states.map(s => <option key={s.state_id} value={s.state_id}>{s.state_name}</option>)}
          </select>
          {selectedState && (
            <select value={selectedLga} onChange={(e) => handleLgaSelect(parseInt(e.target.value))}
              className="appearance-none h-full text-xs bg-white/15 backdrop-blur-md border-0 shadow-lg rounded-lg px-3 py-2.5 pr-6 w-[110px] sm:w-[140px] text-gray-900 font-medium cursor-pointer">
              <option value="">LGA</option>
              {lgas.map(l => <option key={l.lga_id} value={l.lga_id}>{l.lga_name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Right buttons */}
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
        <button onClick={() => setMapType(prev => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))} className="bg-white/80 backdrop-blur-md p-2.5 rounded-lg shadow-lg border border-white/30 hover:bg-white/60 transition">
          <Satellite className="h-4 w-4 text-gray-700" />
        </button>
      </div>

      {/* Map */}
      <div className="flex h-full">
        <div className={cn('flex-1 relative', !showProviderList && 'w-full')}>
          <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={defaultCenter} zoom={7} mapTypeId={mapType}
            onLoad={(map) => { mapRef.current = map; }}
            options={{
              mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || '',
              restriction: { latLngBounds: nigeriaBounds, strictBounds: false },
              minZoom: 6, streetViewControl: false, mapTypeControl: false, fullscreenControl: false,
              zoomControl: true, gestureHandling: 'greedy',
            }}>
            {userLocation && <UserLocationOverlay position={userLocation} />}
            {providersWithCoords.map(p => (
              p.lat != null && p.lng != null && (
                <ProviderMarkerOverlay key={p.id} position={{ lat: p.lat, lng: p.lng }} status={p.status} onClick={() => setSelectedProvider(p)} />
              )
            ))}
            {selectedProvider && (
              <InfoWindow position={{ lat: selectedProvider.lat, lng: selectedProvider.lng }} onCloseClick={() => setSelectedProvider(null)}>
                <div className="w-56 font-sans text-sm">
                  <h4 className="font-semibold text-gray-900 mb-1">{selectedProvider.business_name || 'Provider'}</h4>
                  <p className="text-gray-500">{[selectedProvider.lga_name, selectedProvider.state_name].filter(Boolean).join(', ') || ''}</p>
                  {selectedProvider.distance !== undefined && (
                    <p className="font-medium text-gray-700 mt-1">{selectedProvider.distance.toFixed(1)} km away</p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <a href={`/provider/${selectedProvider.id}`} className="flex-1 text-center bg-primary-600 text-white py-1.5 rounded-md text-xs font-medium hover:bg-primary-700">View Details →</a>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>

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
              <h3 className="font-semibold text-gray-900">{isLoading ? 'Searching…' : `${providersWithCoords.length} provider${providersWithCoords.length !== 1 ? 's' : ''} found`}</h3>
            </div>
            <div className="p-3 space-y-3">
              {isLoading ? (
                <div className="space-y-2">{Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div>
              ) : (
                providersWithCoords.map(provider => (
                  <button key={provider.id} onClick={() => { setSelectedProvider(provider); if (provider.lat && provider.lng) flyTo(provider.lat, provider.lng, 17); }}
                    className={cn('w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition', selectedProvider?.id === provider.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200')}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                        {provider.avatar_url ? <img src={provider.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-primary-600 bg-primary-50">{(provider.business_name || 'P')[0]}</div>}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{provider.business_name || 'Unnamed'}</p>
                        <p className="text-xs text-gray-500">{provider.lga_name || 'Location not set'}{provider.distance !== undefined && ` • ${provider.distance.toFixed(1)} km`}</p>
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