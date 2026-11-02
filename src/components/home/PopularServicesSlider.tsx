// src/components/home/PopularServicesSlider.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/supabase-any';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationStore } from '@/stores/locationStore';
import { useState, useEffect } from 'react';

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
      </div>
    </section>
  );
}