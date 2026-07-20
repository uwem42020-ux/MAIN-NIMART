// src/components/home/PopularServicesSlider.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { db } from '@/lib/supabase-any';
import { TrendingUp } from 'lucide-react';
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

const defaultIcon = '/auto/vehicle.png';

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

  const colorSchemes = [
    { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', subtext: 'text-purple-600' },
    { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', subtext: 'text-green-600' },
    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', subtext: 'text-blue-600' },
    { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', subtext: 'text-amber-600' },
    { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', subtext: 'text-rose-600' },
    { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', subtext: 'text-cyan-600' },
    { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', subtext: 'text-indigo-600' },
    { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', subtext: 'text-teal-600' },
  ];

  if (!combos || combos.length === 0) return null;

  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-green-500 flex items-center justify-center shadow-md shadow-primary-500/20">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Popular Services Near You</h2>
        </div>

        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory">
          {combos.map((combo, idx) => {
            const colors = colorSchemes[idx % colorSchemes.length];
            const iconSrc = categoryIcons[combo.cat] || defaultIcon;
            const displayName = combo.cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            return (
              <Link
                key={idx}
                href={`/services/${combo.cat}/in/${combo.lgaId}`}
                className="flex-shrink-0 w-[75%] sm:w-[45%] lg:w-auto snap-start"
              >
                <div className={`flex items-center gap-4 p-4 rounded-xl border ${colors.bg} ${colors.border}`}>
                  <img
                    src={iconSrc}
                    alt={displayName}
                    className="h-10 w-10 flex-shrink-0 object-contain"
                    width={40}
                    height={40}
                  />
                  <div>
                    <h3 className={`font-semibold text-sm ${colors.text} line-clamp-1`}>
                      {displayName}
                    </h3>
                    <p className={`text-xs ${colors.subtext} mt-0.5`}>
                      {combo.lga} · {combo.count} provider{combo.count !== 1 ? 's' : ''}
                    </p>
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