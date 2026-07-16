// src/components/customer/FindProvidersRadar.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/lib/supabase-any';
import { X, Search, Loader2, Navigation, ChevronDown, AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { getAllCategories, SUBCATEGORIES } from '@/data/categories';
import { LocationDropdown } from '@/components/common/LocationDropdown';
import Link from 'next/link';

// ----- helper: distance & bearing -----
function getDistanceAndBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
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

// Enhance with subcategory keywords -> category slug
const subcategoryKeywords: Map<string, string> = new Map();
SUBCATEGORIES.forEach(sub => {
  const key = sub.name.toLowerCase().trim();
  if (!subcategoryKeywords.has(key)) {
    subcategoryKeywords.set(key, sub.category_slug);
  }
});

const normalizeText = (s: string) =>
  s.trim().replace(/\s+/g, ' ').replace(/&amp;/g, '&').toLowerCase();

export function FindProvidersRadar({
  isOpen,
  onClose,
  userLat,
  userLng,
}: FindProvidersRadarProps) {
  // Location data (loaded internally)
  const [states, setStates] = useState<any[]>([]);
  const [lgas, setLgas] = useState<Record<string, any[]>>({});
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationLoadError, setLocationLoadError] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const categorySlugRef = useRef('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(
    userLat && userLng ? { lat: userLat, lng: userLng } : null
  );
  const [gettingLocation, setGettingLocation] = useState(false);
  const [radius, setRadius] = useState<number>(20);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationLabel, setLocationLabel] = useState(
    userLat && userLng ? 'My location' : 'All Nigeria'
  );

  const suppressSuggestionsRef = useRef(false);
  const locationButtonRef = useRef<HTMLButtonElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const rotationAngleRef = useRef(0);
  const scanningRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

  // Local pulse phase – per component instance
  const pulsePhaseRef = useRef(0);

  useEffect(() => {
    scanningRef.current = scanning;
  }, [scanning]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  // Canvas sizing
  useEffect(() => {
    if (!isOpen) return;
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height, 500);
        setDimensions({ width: size, height: size });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isOpen]);

  // Load states & LGAs internally – only once
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
      const uniqueStates = dataArr.filter((v, i, a) =>
        a.findIndex(t => t.state_id === v.state_id) === i
      );
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
    if (states.length === 0 && !locationLoading && !locationLoadError) {
      loadLocations();
    }
  }, [isOpen, states.length, locationLoading, locationLoadError, loadLocations]);

  // Initial location
  useEffect(() => {
    if (!isOpen) return;
    if (userLat && userLng) {
      setCurrentCoords({ lat: userLat, lng: userLng });
      setLocationLabel('My location');
      return;
    }
    if (currentCoords) return;
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation not supported.');
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
        console.error(err);
        if (err.code === 1) setErrorMsg('Location denied. Enable location to find providers.');
        else setErrorMsg('Unable to get location.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [isOpen, userLat, userLng]);

  // Location selection
  const handleLocationSelect = (type: 'state' | 'lga', id: string, label: string) => {
    if (type === 'lga') {
      const stateId = Object.keys(lgas).find(key =>
        lgas[key].some((lga: any) => lga.lga_id.toString() === id)
      );
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

  // Reset all search state
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

  // Fetch providers for a given slug
  const fetchNearbyProvidersWithSlug = async (slug: string) => {
    if (!slug) {
      setErrorMsg('Please select a service category.');
      return;
    }
    setLoading(true);
    setScanning(true);
    setErrorMsg('');
    setProviders([]);
    setSelectedProvider(null);
    rotationAngleRef.current = 0;

    // Start animation
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    const animate = () => {
      if (!scanningRef.current) return;
      rotationAngleRef.current = (rotationAngleRef.current + 2) % 360;
      drawCanvas();
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);

    try {
      const { data: providersData, error: providersError } = await db
        .from('providers')
        .select('id, business_name, selected_category_slug, boost_until')
        .eq('selected_category_slug', slug)
        .eq('is_available', true)
        .limit(200);

      if (providersError) throw providersError;
      const provs = (providersData || []) as any[];
      if (provs.length === 0) {
        setErrorMsg(`No providers found for "${category}". Try a different category.`);
        setScanning(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        drawCanvas();
        return;
      }

      const providerIds = provs.map((p: any) => p.id);
      const { data: profilesData, error: profilesError } = await db
        .from('profiles')
        .select('id, lat, lng, avatar_url')
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
          const { distance, bearing } = getDistanceAndBearing(
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
              bearing,
              lat: profile.lat,
              lng: profile.lng,
              category: prov.selected_category_slug,
              avatar_url: profile.avatar_url,
            });
          }
        }
        // Sort: boosted first, then by distance
        nearby.sort((a, b) => {
          const aBoosted = provs.find((p: any) => p.id === a.id)?.boost_until && new Date(provs.find((p: any) => p.id === a.id)!.boost_until!) > new Date() ? 1 : 0;
          const bBoosted = provs.find((p: any) => p.id === b.id)?.boost_until && new Date(provs.find((p: any) => p.id === b.id)!.boost_until!) > new Date() ? 1 : 0;
          if (aBoosted !== bBoosted) return bBoosted - aBoosted;
          return a.distance - b.distance;
        });
      }

      setProviders(nearby.slice(0, 50));
      if (nearby.length === 0) {
        setErrorMsg(
          currentCoords === null
            ? `No providers with location data found for "${category}".`
            : `No providers within ${radius}km. Try a wider radius.`
        );
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to fetch providers. Please try again.');
    } finally {
      setLoading(false);
      setScanning(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      drawCanvas();
    }
  };

  // Autocomplete with extended keyword matching
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

      const catMatches = allCategoryNames.filter(name =>
        name.toLowerCase().includes(term)
      );

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
      if (e.key === 'Enter') {
        e.preventDefault();
        applyCategory(searchTerm);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggestionIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestionIndex >= 0) {
        applyCategory(suggestions[suggestionIndex]);
      } else {
        applyCategory(searchTerm);
      }
    }
  };

  const selectSuggestion = (name: string) => {
    applyCategory(name);
  };

  // ---- CANVAS DRAWING ----
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = dimensions.width;
    canvas.width = size;
    canvas.height = size;
    const centerX = size / 2;
    const centerY = size / 2;
    const maxRadius = size * 0.4;
    const isScanning = scanningRef.current;

    // Background
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#0a0f1e');
    grad.addColorStop(1, '#101624');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    if (currentCoords !== null) {
      const ringKm = [radius * 0.25, radius * 0.5, radius * 0.75, radius];
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
      ctx.lineWidth = 1;
      ringKm.forEach(km => {
        const r = (km / radius) * maxRadius;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = 'rgba(200, 220, 255, 0.7)';
        ctx.font = '10px monospace';
        ctx.fillText(`${km}km`, centerX + r + 3, centerY - 3);
      });
    } else {
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
      ctx.font = '12px monospace';
      ctx.fillText('All Nigeria', centerX - 35, centerY - maxRadius - 5);
    }

    // Crosshair
    ctx.beginPath();
    ctx.moveTo(centerX - 5, centerY);
    ctx.lineTo(centerX + 5, centerY);
    ctx.moveTo(centerX, centerY - 5);
    ctx.lineTo(centerX, centerY + 5);
    ctx.stroke();

    // Pulsing You dot
    if (currentCoords !== null) {
      pulsePhaseRef.current = (pulsePhaseRef.current + 0.05) % (2 * Math.PI);
      const pulseRadius = 6 + Math.sin(pulsePhaseRef.current) * 4;
      ctx.fillStyle = '#3b82f6';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#3b82f6';
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(59,130,246,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius + 4, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Provider markers
    if (!isScanning) {
      providers.forEach(provider => {
        if (currentCoords === null) return;
        const r = (provider.distance / radius) * maxRadius;
        const angle = (provider.bearing - 90) * Math.PI / 180;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);

        ctx.fillStyle = '#10b981';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#10b981';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;

        (provider as any).canvasX = x;
        (provider as any).canvasY = y;
      });
    }

    // Sweeping radar line
    if (isScanning && currentCoords !== null) {
      const angle = (rotationAngleRef.current - 90) * Math.PI / 180;
      const ex = centerX + maxRadius * Math.cos(angle);
      const ey = centerY + maxRadius * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = '#00ffaa';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00ffaa';
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [dimensions, providers, radius, currentCoords]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (scanning || currentCoords === null) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    const found = providers.find(p => {
      const dx = (p as any).canvasX - clickX;
      const dy = (p as any).canvasY - clickY;
      return Math.hypot(dx, dy) < 15;
    });
    setSelectedProvider(found || null);
  };

  const requestLocationAgain = () => {
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setErrorMsg('');
        setGettingLocation(false);
        setLocationLabel('My location');
      },
      (err) => {
        setErrorMsg('Location access still denied.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center">
      <div className="relative w-full h-full max-w-5xl mx-auto flex flex-col" ref={containerRef}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 transition"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Main content: Canvas + controls */}
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 p-4 pt-16 md:pt-4 overflow-auto">
          {/* Canvas area */}
          <div className="flex-1 flex justify-center items-start md:items-center mt-2 md:mt-0">
            <canvas
              ref={canvasRef}
              width={dimensions.width}
              height={dimensions.height}
              className="rounded-full shadow-2xl cursor-pointer transition hover:scale-[1.02] bg-black/40 max-w-full"
              onClick={handleCanvasClick}
            />
          </div>

          {/* Right panel with all controls */}
          <div className="flex-1 w-full max-w-md space-y-4 mt-2 md:mt-0">
            {/* Location + GPS button */}
            <div className="flex flex-row gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">📍 Location</label>
                {locationLoading ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                  </div>
                ) : locationLoadError ? (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Failed.</span>
                    <button onClick={loadLocations} className="underline text-cyan-400 text-sm">Retry</button>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      ref={locationButtonRef}
                      onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 flex items-center justify-between gap-1 hover:bg-gray-750 transition"
                    >
                      <span className="truncate">{locationLabel}</span>
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
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
                <button
                  onClick={requestLocationAgain}
                  disabled={gettingLocation}
                  className="h-[42px] px-3 bg-primary-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                >
                  {gettingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                  <span className="text-xs sm:text-sm">My Location</span>
                </button>
              </div>
            </div>

            {/* Radius selector */}
            {currentCoords !== null && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Search Radius</label>
                <div className="flex gap-2 flex-wrap">
                  {RADIUS_OPTIONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setRadius(r)}
                      className={`px-3 py-1 rounded-full text-sm ${radius === r ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category input with autocomplete */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Service Category</label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., Auto Repair, Plumbing, Graphic Design..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {suggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((s, idx) => (
                      <li
                        key={s}
                        className={`px-4 py-2 cursor-pointer text-white ${idx === suggestionIndex ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
                        onMouseDown={e => {
                          e.preventDefault();
                          selectSuggestion(s);
                        }}
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (categorySlug) {
                    fetchNearbyProvidersWithSlug(categorySlug);
                  } else {
                    applyCategory(searchTerm);
                  }
                }}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                {loading ? 'Scanning...' : 'Find Providers'}
              </button>
              <button
                onClick={resetSearch}
                className="flex items-center justify-center gap-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg transition"
                title="Reset search"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
                {errorMsg}
              </div>
            )}

            {selectedProvider && (
              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="font-semibold text-white">{selectedProvider.business_name}</p>
                <p className="text-sm text-gray-300">
                  {selectedProvider.distance > 0 ? `${selectedProvider.distance.toFixed(1)} km away` : ''}
                </p>
                <Link
                  href={`/provider/${selectedProvider.id}`}
                  onClick={onClose}
                  className="mt-2 inline-block text-cyan-400 text-sm hover:underline"
                >
                  View Profile →
                </Link>
              </div>
            )}

            {/* Nearest Providers list – boosted first, then by distance */}
            {providers.length > 0 && !selectedProvider && (
              <div className="bg-gray-800 rounded-lg p-3 max-h-60 overflow-auto space-y-2">
                <p className="text-sm text-gray-300 font-medium mb-1">
                  {currentCoords !== null ? 'Nearest Providers' : 'All Providers'}
                </p>
                {providers.map(p => (
                  <button
                    key={p.id}
                    className="block w-full text-left p-2 rounded hover:bg-gray-700 text-white"
                    onClick={() => setSelectedProvider(p)}
                  >
                    <span className="font-medium">{p.business_name}</span>
                    {currentCoords !== null && (
                      <span className="float-right text-xs text-gray-400">{p.distance.toFixed(1)} km</span>
                    )}
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