// src/components/customer/FindProvidersRadar.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { GoogleMap, useJsApiLoader, OverlayView, Circle } from '@react-google-maps/api';
import { db } from '@/lib/supabase-any';
import { getAllCategories, SUBCATEGORIES } from '@/data/categories';
import { LocationDropdown } from '@/components/common/LocationDropdown';
import {
  X, Search, Loader2, Navigation, ChevronDown, AlertTriangle, RotateCcw,
  MapPin, Sparkles, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

/* ---------- helpers ---------- */
function getDistanceAndBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x =
    Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;
  return { distance, bearing };
}

interface Provider {
  id: string;
  business_name: string;
  distance: number;
  bearing: number;
  lat: number;
  lng: number;
  category: string;
  avatar_url?: string;
}

interface FindProvidersRadarProps {
  isOpen: boolean;
  onClose: () => void;
  userLat: number | null;
  userLng: number | null;
}

const RADIUS_OPTIONS = [10, 20, 50, 100];

const categoryNameToSlug = new Map(getAllCategories().map(c => [c.name, c.slug]));
const allCategoryNames = Array.from(categoryNameToSlug.keys()).sort();

const subcategoryKeywords: Map<string, string> = new Map();
SUBCATEGORIES.forEach(sub => {
  const key = sub.name.toLowerCase().trim();
  if (!subcategoryKeywords.has(key)) {
    subcategoryKeywords.set(key, sub.category_slug);
  }
});

const normalizeText = (s: string) =>
  s.trim().replace(/\s+/g, ' ').replace(/&amp;/g, '&').toLowerCase();

/* ---------- marker overlays (same as MapView) ---------- */
const statusColors: Record<string, string> = {
  available: '#22c55e',
  busy: '#eab308',
  away: '#ef4444',
};

function UserLocationOverlay({ position }: { position: google.maps.LatLngLiteral }) {
  if (!position) return null;
  return (
    <OverlayView position={position} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={() => ({ x: -16, y: -16 })}>
      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping" />
          <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg z-10" />
        </div>
      </div>
    </OverlayView>
  );
}

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
    <OverlayView position={position} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={() => ({ x: -14, y: -30 })}>
      <div className="flex flex-col items-center cursor-pointer" onClick={onClick}>
        <div className="w-4 h-4 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: color }} />
        <img src="/robot-marker.png" alt="" className="w-6 h-6 mt-0.5 object-contain" style={{ imageRendering: 'auto' }} />
      </div>
    </OverlayView>
  );
}

/* ---------- radar rings overlay (circle inside map) ---------- */
function RadarRings({ center, radiusKm }: { center: google.maps.LatLngLiteral; radiusKm: number }) {
  if (!center) return null;
  const rings = [radiusKm * 0.25, radiusKm * 0.5, radiusKm * 0.75, radiusKm];
  return (
    <>
      {rings.map((r, i) => (
        <Circle
          key={i}
          center={center}
          radius={r * 1000}
          options={{
            strokeColor: '#64c8ff',
            strokeOpacity: 0.4,
            strokeWeight: 1,
            fillOpacity: 0,
            clickable: false,
            zIndex: 1,
          }}
        />
      ))}
    </>
  );
}

export function FindProvidersRadar({
  isOpen,
  onClose,
  userLat,
  userLng,
}: FindProvidersRadarProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const mapRef = useRef<google.maps.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const locationButtonRef = useRef<HTMLButtonElement>(null);
  const categorySlugRef = useRef('');
  const suppressSuggestionsRef = useRef(false);

  const { isLoaded } = useJsApiLoader({ id: 'radar-map', googleMapsApiKey: apiKey });

  // ---- state ----
  const [states, setStates] = useState<any[]>([]);
  const [lgas, setLgas] = useState<Record<string, any[]>>({});
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationLoadError, setLocationLoadError] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentCoords, setCurrentCoords] = useState<google.maps.LatLngLiteral | null>(
    userLat && userLng ? { lat: userLat, lng: userLng } : null
  );
  const [gettingLocation, setGettingLocation] = useState(false);
  const [radius, setRadius] = useState<number>(20);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationLabel, setLocationLabel] = useState(
    userLat && userLng ? 'My location' : 'All Nigeria'
  );
  const [showOnboarding, setShowOnboarding] = useState(true);

  // ---- load LGA data ----
  const loadLocations = useCallback(async () => {
    setLocationLoading(true);
    setLocationLoadError(false);
    try {
      const { data: allStates, error: stateError } = await db
        .from('lga_centers')
        .select('state_id, state_name')
        .order('state_name');
      if (stateError) throw stateError;
      const dataArr = (allStates || []) as any[];
      const uniqueStates = dataArr.filter((v, i, a) => a.findIndex(t => t.state_id === v.state_id) === i);
      setStates(uniqueStates);

      const { data: allLgas, error: lgaError } = await db
        .from('lga_centers')
        .select('lga_id, lga_name, state_id, lat, lng')
        .order('lga_name');
      if (lgaError) throw lgaError;
      if (allLgas) {
        const lgasArr = allLgas as any[];
        const grouped: Record<string, any[]> = {};
        lgasArr.forEach((lga) => {
          const key = lga.state_id.toString();
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(lga);
        });
        setLgas(grouped);
      }
    } catch (err) {
      console.error('Radar: failed to load locations', err);
      setLocationLoadError(true);
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (states.length === 0 && !locationLoading && !locationLoadError) loadLocations();
  }, [isOpen, states.length, locationLoading, locationLoadError, loadLocations]);

  // ---- geolocation ----
  useEffect(() => {
    if (!isOpen || !navigator.geolocation) return;
    if (userLat && userLng) {
      setCurrentCoords({ lat: userLat, lng: userLng });
      setLocationLabel('My location');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGettingLocation(false);
        setErrorMsg('');
        setLocationLabel('My location');
      },
      (err) => {
        if (err.code === 1) setErrorMsg('Location denied. Enable location to find providers.');
        else setErrorMsg('Unable to get location.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [isOpen, userLat, userLng]);

  // ---- location dropdown handlers ----
  const handleLocationSelect = (type: 'state' | 'lga', id: string, label: string) => {
    if (type === 'lga') {
      const stateId = Object.keys(lgas).find(key => lgas[key].some((lga: any) => lga.lga_id.toString() === id));
      if (stateId) {
        const lga = lgas[stateId].find((l: any) => l.lga_id.toString() === id);
        if (lga?.lat && lga?.lng) {
          setCurrentCoords({ lat: lga.lat, lng: lga.lng });
          setErrorMsg('');
          setLocationLabel(label);
        } else {
          setErrorMsg('Selected LGA has no coordinates. Try another or use GPS.');
        }
      }
    } else if (type === 'state') {
      const stateLgas = lgas[id] || [];
      const withCoords = stateLgas.filter((l: any) => l.lat && l.lng);
      if (withCoords.length > 0) {
        const avgLat = withCoords.reduce((s: number, l: any) => s + l.lat, 0) / withCoords.length;
        const avgLng = withCoords.reduce((s: number, l: any) => s + l.lng, 0) / withCoords.length;
        setCurrentCoords({ lat: avgLat, lng: avgLng });
        setErrorMsg('');
        setLocationLabel(label);
      } else {
        setCurrentCoords(null);
        setLocationLabel(label + ' (no map data)');
        setErrorMsg('No coordinate data for this state. Try an LGA or use GPS.');
      }
    }
    setShowLocationDropdown(false);
  };

  const clearLocation = () => {
    setCurrentCoords(null);
    setLocationLabel('All Nigeria');
    setShowLocationDropdown(false);
    setErrorMsg('');
  };

  const resetSearch = () => {
    setSearchTerm('');
    setCategory('');
    setCategorySlug('');
    categorySlugRef.current = '';
    setSuggestions([]);
    setProviders([]);
    setSelectedProvider(null);
    setErrorMsg('');
  };

  // ---- fetch providers ----
  const fetchNearbyProvidersWithSlug = async (slug: string) => {
    if (!slug) {
      setErrorMsg('Please select a service category.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setProviders([]);
    setSelectedProvider(null);
    setShowOnboarding(false);

    try {
      const { data: providersData, error: providersError } = await db
        .from('providers')
        .select('id, business_name, selected_category_slug, boost_until, status')
        .eq('selected_category_slug', slug)
        .eq('is_available', true)
        .limit(200);

      if (providersError) throw providersError;
      const provs = (providersData || []) as any[];
      if (provs.length === 0) {
        setErrorMsg(`No providers found for "${category}". Try a different category or increase the radius.`);
        return;
      }

      const providerIds = provs.map((p: any) => p.id);
      const { data: profilesData, error: profilesError } = await db
        .from('profiles')
        .select('id, lat, lng, avatar_url, lga_name')
        .in('id', providerIds);

      if (profilesError) throw profilesError;
      const profs = (profilesData || []) as any[];
      const profileMap = new Map(profs.map((p: any) => [p.id, p]));

      const nearby: Provider[] = [];
      if (currentCoords === null) {
        for (const prov of provs) {
          const profile = profileMap.get(prov.id);
          if (!profile?.lat || !profile?.lng) continue;
          nearby.push({
            id: prov.id,
            business_name: prov.business_name,
            distance: 0,
            bearing: 0,
            lat: profile.lat,
            lng: profile.lng,
            category: prov.selected_category_slug,
            avatar_url: profile.avatar_url,
          });
        }
        nearby.sort((a, b) => a.business_name.localeCompare(b.business_name));
      } else {
        for (const prov of provs) {
          const profile = profileMap.get(prov.id);
          if (!profile?.lat || !profile?.lng) continue;
          const { distance } = getDistanceAndBearing(
            currentCoords.lat,
            currentCoords.lng,
            profile.lat,
            profile.lng
          );
          if (distance <= radius) {
            nearby.push({
              id: prov.id,
              business_name: prov.business_name,
              distance,
              bearing: 0,
              lat: profile.lat,
              lng: profile.lng,
              category: prov.selected_category_slug,
              avatar_url: profile.avatar_url,
            });
          }
        }
        nearby.sort((a, b) => a.distance - b.distance);
      }

      setProviders(nearby.slice(0, 50));
      if (nearby.length === 0) {
        setErrorMsg(currentCoords === null
          ? `No providers with location data found for "${category}".`
          : `No providers within ${radius}km. Try a wider radius.`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to fetch providers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---- autocomplete ----
  useEffect(() => {
    const timer = setTimeout(() => {
      if (suppressSuggestionsRef.current) {
        setSuggestions([]);
        return;
      }
      if (!searchTerm.trim()) {
        setSuggestions([]);
        setSuggestionIndex(-1);
        return;
      }
      const term = searchTerm.toLowerCase().trim();
      const catMatches = allCategoryNames.filter(name => name.toLowerCase().includes(term));
      const subMatches: string[] = [];
      subcategoryKeywords.forEach((catSlug, subName) => {
        if (subName.includes(term)) {
          const catObj = getAllCategories().find(c => c.slug === catSlug);
          if (catObj && !catMatches.includes(catObj.name) && !subMatches.includes(catObj.name)) {
            subMatches.push(catObj.name);
          }
        }
      });
      const combined = [...new Set([...catMatches, ...subMatches])].slice(0, 10);
      setSuggestions(combined);
      setSuggestionIndex(-1);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const resolveCategorySlug = (input: string): string | undefined => {
    const normalized = normalizeText(input);
    let slug = categoryNameToSlug.get(input);
    if (slug) return slug;
    for (const [name, s] of categoryNameToSlug.entries()) {
      if (normalizeText(name) === normalized) return s;
    }
    const lower = input.toLowerCase().trim();
    for (const [subName, catSlug] of subcategoryKeywords.entries()) {
      if (subName === lower) return catSlug;
    }
    return undefined;
  };

  const applyCategory = (displayName: string) => {
    const slug = resolveCategorySlug(displayName);
    if (slug) {
      setCategory(displayName);
      setCategorySlug(slug);
      categorySlugRef.current = slug;
      setSearchTerm(displayName);
      setSuggestions([]);
      suppressSuggestionsRef.current = true;
      setTimeout(() => { suppressSuggestionsRef.current = false; }, 300);
      fetchNearbyProvidersWithSlug(slug);
    } else {
      const fallbackSlug = normalizeText(displayName)
        .replace(/[&]/g, 'and')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      setCategory(displayName);
      setCategorySlug(fallbackSlug);
      categorySlugRef.current = fallbackSlug;
      setSearchTerm(displayName);
      setSuggestions([]);
      suppressSuggestionsRef.current = true;
      setTimeout(() => { suppressSuggestionsRef.current = false; }, 300);
      fetchNearbyProvidersWithSlug(fallbackSlug);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) {
      if (e.key === 'Enter') { e.preventDefault(); applyCategory(searchTerm); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSuggestionIndex(prev => (prev + 1) % suggestions.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestionIndex >= 0) applyCategory(suggestions[suggestionIndex]);
      else applyCategory(searchTerm);
    }
  };

  const selectSuggestion = (name: string) => applyCategory(name);

  if (!isOpen) return null;

  const mapCenter = currentCoords || { lat: 9.0765, lng: 7.3986 };
  const mapZoom = currentCoords ? 13 : 7;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center">
      <div className="relative w-full h-full max-w-5xl mx-auto flex flex-col" ref={containerRef}>
        <button onClick={onClose} className="absolute top-4 right-4 z-20 bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 transition">
          <X className="h-6 w-6" />
        </button>

        {/* Onboarding */}
        {showOnboarding && !category && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-gray-900 text-white rounded-2xl p-6 max-w-sm text-center shadow-2xl border border-gray-700">
              <Sparkles className="h-10 w-10 mx-auto text-cyan-400 mb-3" />
              <h3 className="text-lg font-bold mb-2">Find Providers Near You</h3>
              <p className="text-sm text-gray-300 mb-4">
                Type a service category (e.g. Plumber, Makeup Artist) and press Enter to scan.
                Tap on the coloured dots to see providers and book instantly.
              </p>
              <button
                onClick={() => { setShowOnboarding(false); inputRef.current?.focus(); }}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-xl font-medium transition"
              >
                Got it!
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 p-4 pt-16 md:pt-4 overflow-auto">
          {/* MAP IN A CIRCLE */}
          <div className="flex-1 flex justify-center items-center">
            <div className="relative w-full max-w-[400px] aspect-square">
              <div className="absolute inset-0 rounded-full overflow-hidden shadow-2xl border-4 border-gray-700">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={mapCenter}
                    zoom={mapZoom}
                    onLoad={(map) => { mapRef.current = map; }}
                    options={{
                      mapTypeId: 'roadmap',
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                      zoomControl: false,
                      gestureHandling: 'greedy',
                      styles: [
                        { featureType: 'all', elementType: 'labels.text.fill', stylers: [{ color: '#ffffff' }] },
                        { featureType: 'all', elementType: 'labels.text.stroke', stylers: [{ color: '#000000' }, { lightness: 13 }] },
                        { featureType: 'administrative', elementType: 'geometry.fill', stylers: [{ visibility: 'off' }] },
                        { featureType: 'landscape', elementType: 'all', stylers: [{ color: '#08304b' }] },
                        { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#0c4152' }, { lightness: 5 }] },
                        { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#000000' }] },
                        { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#0b434f' }, { lightness: 25 }] },
                        { featureType: 'road.arterial', elementType: 'geometry.fill', stylers: [{ color: '#000000' }] },
                        { featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{ color: '#0b3d51' }, { lightness: 16 }] },
                        { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#000000' }] },
                        { featureType: 'transit', elementType: 'all', stylers: [{ color: '#146474' }] },
                        { featureType: 'water', elementType: 'all', stylers: [{ color: '#021019' }] },
                      ],
                    }}
                  >
                    {currentCoords && <UserLocationOverlay position={currentCoords} />}
                    {currentCoords && <RadarRings center={currentCoords} radiusKm={radius} />}

                    {providers.map((p) => (
                      <ProviderMarkerOverlay
                        key={p.id}
                        position={{ lat: p.lat, lng: p.lng }}
                        status="available"
                        onClick={() => setSelectedProvider(p)}
                      />
                    ))}
                  </GoogleMap>
                ) : (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex-1 w-full max-w-md space-y-4 mt-2 md:mt-0">
            <div className="flex flex-row gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">📍 Location</label>
                {locationLoading ? (
                  <div className="flex items-center gap-2 text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
                ) : locationLoadError ? (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Failed.</span>
                    <button onClick={loadLocations} className="underline text-cyan-400 text-sm">Retry</button>
                  </div>
                ) : (
                  <div className="relative">
                    <button ref={locationButtonRef} onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 flex items-center justify-between gap-1 hover:bg-gray-750 transition">
                      <span className="truncate">{locationLabel}</span><ChevronDown className="h-4 w-4 flex-shrink-0" />
                    </button>
                    {showLocationDropdown && (
                      <LocationDropdown
                        onSelectState={(id, name) => handleLocationSelect('state', id, name)}
                        onSelectLga={(id, name) => handleLocationSelect('lga', id, name)}
                        onClear={clearLocation}
                        onClose={() => setShowLocationDropdown(false)}
                        preloadedStates={states}
                        preloadedLgas={lgas}
                        triggerRef={locationButtonRef}
                      />
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-end">
                <button onClick={() => {
                  if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
                  setGettingLocation(true);
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                      setCurrentCoords(loc);
                      setLocationLabel('My location');
                      setGettingLocation(false);
                    },
                    () => { setErrorMsg('Location access still denied.'); setGettingLocation(false); },
                    { enableHighAccuracy: true, timeout: 10000 }
                  );
                }} disabled={gettingLocation}
                  className="h-[42px] px-3 bg-primary-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-1 whitespace-nowrap">
                  {gettingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                  <span className="text-xs sm:text-sm">My Location</span>
                </button>
              </div>
            </div>

            {currentCoords && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Search Radius</label>
                <div className="flex gap-2 flex-wrap">
                  {RADIUS_OPTIONS.map(r => (
                    <button key={r} onClick={() => setRadius(r)}
                      className={`px-3 py-1 rounded-full text-sm ${radius === r ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                      {r} km
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Service Category</label>
              <div className="relative">
                <input ref={inputRef} type="text" value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="e.g., Auto Repair, Plumbing, Makeup..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm sm:text-base" />
                {suggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((s, idx) => (
                      <li key={s} className={`px-4 py-2 cursor-pointer text-white ${idx === suggestionIndex ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                        onMouseDown={e => { e.preventDefault(); selectSuggestion(s); }}>
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => {
                if (categorySlug) fetchNearbyProvidersWithSlug(categorySlug);
                else applyCategory(searchTerm);
              }} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                {loading ? 'Scanning...' : 'Find Providers'}
              </button>
              <button onClick={resetSearch}
                className="flex items-center justify-center gap-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg transition">
                <RotateCcw className="h-4 w-4" /><span className="text-xs">Reset</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white mb-1">No Results</p>
                    <p>{errorMsg}</p>
                    <p className="mt-1 text-xs text-gray-400">Try a different category, increase the radius, or check your location.</p>
                  </div>
                </div>
              </div>
            )}

            {selectedProvider && (
              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="font-semibold text-white">{selectedProvider.business_name}</p>
                <p className="text-sm text-gray-300">{selectedProvider.distance > 0 ? `${selectedProvider.distance.toFixed(1)} km away` : ''}</p>
                <Link href={`/provider/${selectedProvider.id}`} onClick={onClose}
                  className="mt-2 inline-flex items-center gap-1 bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary-700 transition">
                  View Profile <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {providers.length > 0 && !selectedProvider && (
              <div className="bg-gray-800 rounded-lg p-3 max-h-60 overflow-auto space-y-2">
                <p className="text-sm text-gray-300 font-medium mb-1">{currentCoords ? 'Nearest Providers' : 'All Providers'}</p>
                {providers.map(p => (
                  <button key={p.id} className="block w-full text-left p-2 rounded hover:bg-gray-700 text-white"
                    onClick={() => setSelectedProvider(p)}>
                    <span className="font-medium">{p.business_name}</span>
                    {currentCoords && <span className="float-right text-xs text-gray-400">{p.distance.toFixed(1)} km</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}