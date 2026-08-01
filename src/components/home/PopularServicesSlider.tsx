// src/components/home/PopularServicesSlider.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { db } from '@/lib/supabase-any';
import { MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationStore } from '@/stores/locationStore';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const categoryIcons: Record<string, string> = {
  'vehicle-mechanics': '/auto/vehicle.png',
  'roadside-emergencies': '/auto/emergencies.png',
  'auto-repair': '/auto/autorepair.png',
  'auto-maintenance': '/auto/automaintenace.png',
  'auto-parts': '/auto/parts.png',
  'commercial-vehicles': '/auto/commercial.png',
  'official-vehicle': '/auto/official.png',
  plumbing: '/auto/plumber.png',
  electrical: '/auto/electrical.png',
  construction: '/auto/construction.png',
  carpentry: '/auto/capentary.png',
  painting: '/auto/painter.png',
  'metal-works': '/auto/metalwork.png',
  glass: '/auto/glasswork.png',
  'appliance-repair': '/auto/eletronicsrepair.png',
  'home-security': '/auto/homesecurity.png',
  'medical-emergency': '/auto/medicalemergency.png',
  'fire-rescue': '/auto/fireextinguisher.png',
  'security-guarding': '/auto/security.png',
  legal: '/auto/legal.png',
  financial: '/auto/financial.png',
  business: '/auto/business.png',
  'real-estate': '/auto/realestate.png',
  architecture: '/auto/architectate.png',
  'computer-it': '/auto/computer.png',
  'mobile-phone': '/auto/phone.png',
  'digital-creative': '/auto/digitalcreative.png',
  printing: '/auto/printing.png',
  hair: '/auto/hairservices.png',
  makeup: '/auto/makeup.png',
  nail: '/auto/nail.png',
  spa: '/auto/spaandwellness.png',
  fashion: '/auto/fashion.png',
  catering: '/auto/cateringservices.png',
  'private-chef': '/auto/privatechef.png',
  'food-delivery': '/auto/fooddelivery.png',
  drinks: '/auto/drinks.png',
  'professional-food': '/auto/professional food services.png',
  photography: '/auto/Event photographer.png',
  'event-planning': '/auto/event planning.png',
  entertainment: '/auto/music and arts.png',
  weddings: '/auto/weddings.png',
  tutoring: '/auto/ucational support.png',
  skills: '/auto/skill.png',
  'music-arts': '/auto/music and arts.png',
  'special-needs': '/auto/special need education.png',
  'edu-support': '/auto/ucational support.png',
  'medical-home': '/auto/medical professional home visit.png',
  'alternative-medicine': '/auto/alternative medicine.png',
  'mental-health': '/auto/mental health.png',
  fitness: '/auto/fitness and sport.png',
  moving: '/auto/moving and relocation.png',
  delivery: '/auto/delivery and courer.png',
  rentals: '/auto/rentals.png',
  'social-groups': '/auto/social groups.png',
  venues: '/auto/events space.png',
  'b2b-partners': '/auto/business partner B2B.png',
  'sme-services': '/auto/business services SME.png',
  'creative-partners': '/auto/creativeeconomy partner.png',
  export: '/auto/export services.png',
  import: '/auto/import services.png',
  'cross-border': '/auto/cross border trade.png',
};

async function reverseGeocodeState(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=en`
    );
    const data = await res.json();
    const address = data?.address;
    if (!address) return null;
    return address.state || address.region || address.county || null;
  } catch {
    return null;
  }
}

export function PopularServicesSlider({ initialCombos = [] }: { initialCombos?: { cat: string; lga: string; lgaId: number; count: number }[] }) {
  const { profile } = useAuth();
  const { lat, lng } = useLocationStore();
  const [gpsState, setGpsState] = useState<string | null>(null);

  // Keep last known data so section never disappears
  const [persistedCombos, setPersistedCombos] = useState(initialCombos);

  useEffect(() => {
    if (lat && lng && !profile?.state_name) {
      reverseGeocodeState(lat, lng).then(state => {
        if (state) setGpsState(state);
      });
    }
  }, [lat, lng, profile?.state_name]);

  const userState = profile?.state_name || gpsState || null;

  const { data: combos } = useQuery({
    queryKey: ['popular-combos', userState],
    queryFn: async () => {
      let lgaIdsInState: number[] | null = null;
      if (userState) {
        const { data: lgas } = await db
          .from('lga_centers')
          .select('lga_id')
          .ilike('state_name', userState);
        if (lgas && (lgas as any[]).length > 0) {
          lgaIdsInState = (lgas as any[]).map((l: any) => l.lga_id);
        } else {
          return [];
        }
      }

      const { data: providers } = await db
        .from('providers')
        .select('id, selected_category_slug')
        .eq('is_available', true)
        .not('selected_category_slug', 'is', null)
        .limit(200);

      if (!providers || (providers as any[]).length === 0) return [];

      const providerIds = (providers as any[]).map((p: any) => p.id);

      let profileQuery = db
        .from('profiles')
        .select('id, lga_name, lga_id')
        .in('id', providerIds)
        .not('lga_name', 'is', null);

      if (lgaIdsInState) {
        profileQuery = profileQuery.in('lga_id', lgaIdsInState);
      }

      const { data: profiles } = await profileQuery;

      if (!profiles || (profiles as any[]).length === 0) return [];

      const profileMap = new Map((profiles as any[]).map((p: any) => [p.id, p]));

      const countMap = new Map<string, number>();
      (providers as any[]).forEach((p: any) => {
        const prof = profileMap.get(p.id);
        if (!prof) return;
        const key = `${p.selected_category_slug}||${prof.lga_name}||${prof.lga_id}`;
        countMap.set(key, (countMap.get(key) || 0) + 1);
      });

      return Array.from(countMap.entries())
        .map(([key, count]) => {
          const [cat, lga, lgaId] = key.split('||');
          return { cat, lga, lgaId: parseInt(lgaId), count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    },
    initialData: userState ? undefined : initialCombos,
    staleTime: 1000 * 60 * 30,
  });

  // Persist data so section never disappears
  useEffect(() => {
    if (combos && combos.length > 0) {
      setPersistedCombos(combos);
    }
  }, [combos]);

  const displayCombos = combos && combos.length > 0 ? combos : persistedCombos;

  if (!displayCombos || displayCombos.length === 0) return null;

  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <style>{`
          @keyframes gentle-float {
            0%, 100% { transform: translateY(0); opacity: 0.7; }
            50% { transform: translateY(-6px); opacity: 1; }
          }
          .animate-gentle-float { animation: gentle-float 2.5s ease-in-out infinite; }
        `}</style>

        <div className="flex items-center gap-3 mb-5">
          <img src="/top.png" alt="" className="h-7 w-7 object-contain animate-gentle-float flex-shrink-0" />
          <div
            className="px-4 py-1.5 rounded-full text-sm font-semibold text-white shadow-md"
            style={{
              background: 'linear-gradient(to left, #597400, #98BC00)',
              boxShadow: '0 4px 12px rgba(89, 116, 0, 0.25)',
            }}
          >
            Popular Services {userState ? `in ${userState}` : 'in Nigeria'}
          </div>
        </div>

        {/* Mobile */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory sm:hidden pl-2">
          {displayCombos.map((combo) => {
            const iconSrc = categoryIcons[combo.cat] || '/auto/vehicle.png';
            const displayName = combo.cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            return (
              <Link
                key={`${combo.cat}-${combo.lgaId}`}
                href={`/services/${combo.cat}/in/${combo.lgaId}`}
                className="flex-shrink-0 w-[170px] snap-start"
              >
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all">
                  <img src={iconSrc} alt="" className="w-8 h-8 object-contain mb-2" width={32} height={32} />
                  <h3 className="font-semibold text-sm text-gray-900 truncate">{displayName}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{combo.lga}</span>
                  </div>
                  <p className="text-xs font-medium text-primary-600 mt-0.5">{combo.count} provider{combo.count !== 1 ? 's' : ''}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Desktop */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayCombos.map((combo) => {
            const iconSrc = categoryIcons[combo.cat] || '/auto/vehicle.png';
            const displayName = combo.cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            return (
              <Link
                key={`${combo.cat}-${combo.lgaId}`}
                href={`/services/${combo.cat}/in/${combo.lgaId}`}
              >
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all h-full flex items-center gap-3">
                  <img src={iconSrc} alt="" className="w-10 h-10 object-contain flex-shrink-0" width={40} height={40} />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 truncate">{displayName}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{combo.lga}</span>
                    </div>
                    <p className="text-xs font-medium text-primary-600 mt-0.5">{combo.count} provider{combo.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}