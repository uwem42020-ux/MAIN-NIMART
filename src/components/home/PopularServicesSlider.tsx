// src/components/home/PopularServicesSlider.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { db } from '@/lib/supabase-any';
import { MapPin } from 'lucide-react';
import { useRef } from 'react';

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

export function PopularServicesSlider({ initialCombos = [] }: { initialCombos?: { cat: string; lga: string; lgaId: number; count: number }[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: combos } = useQuery({
    queryKey: ['popular-combos'],
    queryFn: async () => {
      const { data: providers } = await db
        .from('providers')
        .select('id, selected_category_slug')
        .eq('is_available', true)
        .not('selected_category_slug', 'is', null)
        .limit(100);

      if (!providers || (providers as any[]).length === 0) return [];

      const providerIds = (providers as any[]).map((p: any) => p.id);

      const { data: profiles } = await db
        .from('profiles')
        .select('id, lga_name, lga_id')
        .in('id', providerIds)
        .not('lga_name', 'is', null);

      if (!profiles || (profiles as any[]).length === 0) return [];

      const profileMap = new Map((profiles as any[]).map((p: any) => [p.id, p]));

      const countMap = new Map<string, number>();
      (providers as any[]).forEach((p: any) => {
        const profile = profileMap.get(p.id);
        if (!profile) return;
        const key = `${p.selected_category_slug}||${profile.lga_name}||${profile.lga_id}`;
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
    initialData: initialCombos,
    staleTime: 1000 * 60 * 30,
  });

  if (!combos || combos.length === 0) return null;

  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/top.png" alt="" className="h-7 w-7 object-contain animate-gentle-float" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Popular Services Near You</h2>
        </div>

        <style>{`
          @keyframes gentle-float {
            0%, 100% { transform: translateY(0); opacity: 0.7; }
            50% { transform: translateY(-6px); opacity: 1; }
          }
          .animate-gentle-float {
            animation: gentle-float 2.5s ease-in-out infinite;
          }
        `}</style>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory -mx-4 px-4"
        >
          {combos.map((combo, idx) => {
            const iconSrc = categoryIcons[combo.cat] || '/auto/vehicle.png';
            const displayName = combo.cat
              .split('-')
              .map(w => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ');

            return (
              <Link
                key={`${combo.cat}-${combo.lgaId}`}
                href={`/services/${combo.cat}/in/${combo.lgaId}`}
                className="flex-shrink-0 w-[200px] snap-start group"
              >
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all duration-200 h-full flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-primary-50 transition-colors">
                    <img
                      src={iconSrc}
                      alt={displayName}
                      className="w-9 h-9 object-contain"
                      width={36}
                      height={36}
                    />
                  </div>

                  <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
                    {displayName}
                  </h3>

                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-auto">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{combo.lga}</span>
                  </div>
                  <p className="text-xs font-medium text-primary-600 mt-0.5">
                    {combo.count} provider{combo.count !== 1 ? 's' : ''}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}