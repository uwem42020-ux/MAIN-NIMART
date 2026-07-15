// src/components/common/MobileCategoryPanel.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, Tag, Wrench, Monitor, Scissors, Home, Truck, Briefcase, Shield, Heart, BookOpen, Music, Users, Handshake, Globe, Utensils, Camera, Bike, Car, Flame, Lightbulb, GlassWater, PaintBucket, Dumbbell, Stethoscope, Brain, Plane, Download, Upload, ShoppingBag, Sparkles, Key, PenTool, Palette, Cable, Drill } from 'lucide-react';
import { CATEGORIES, SUBCATEGORIES } from '@/data/categories';
import Link from 'next/link';

interface MobileCategoryPanelProps {
  tierSlug: string;
  tierName: string;
  tierIcon: string;
  providerCounts: Record<string, number>;
  subcategoryCounts: Record<number, number>;
  onClose: () => void;
}

// 🖼️ Category custom PNGs (unchanged)
const categoryPngMap: Record<string, string> = {
  'vehicle-mechanics': '/auto/vehicle.png',
  'roadside-emergencies': '/auto/emergencies.png',
  'auto-repair': '/auto/autorepair.png',
  'auto-maintenance': '/auto/automaintenace.png',
  'auto-parts': '/auto/parts.png',
  'commercial-vehicles': '/auto/commercial.png',
  'official-vehicle': '/auto/official.png',
  'plumbing': '/auto/plumber.png',
  'electrical': '/auto/electrical.png',
  'construction': '/auto/construction.png',
  'carpentry': '/auto/capentary.png',
  'painting': '/auto/painter.png',
  'metal-works': '/auto/metalwork.png',
  'glass': '/auto/glasswork.png',
  'appliance-repair': '/auto/eletronicsrepair.png',
  'home-security': '/auto/homesecurity.png',
  'medical-emergency': '/auto/medicalemergency.png',
  'fire-rescue': '/auto/fireextinguisher.png',
  'security-guarding': '/auto/security.png',
  'legal': '/auto/legal.png',
  'financial': '/auto/financial.png',
  'business': '/auto/business.png',
  'real-estate': '/auto/realestate.png',
  'architecture': '/auto/architectate.png',
  'computer-it': '/auto/computer.png',
  'mobile-phone': '/auto/phone.png',
  'digital-creative': '/auto/digitalcreative.png',
  'printing': '/auto/printing.png',
  'hair': '/auto/hairservices.png',
  'makeup': '/auto/makeup.png',
  'nail': '/auto/nail.png',
  'spa': '/auto/spaandwellness.png',
  'fashion': '/auto/fashion.png',
  'catering': '/auto/cateringservices.png',
  'private-chef': '/auto/privatechef.png',
  'food-delivery': '/auto/fooddelivery.png',
  'drinks': '/auto/drinks.png',
  'professional-food': '/auto/professional food services.png',
  'photography': '/auto/Event photographer.png',
  'event-planning': '/auto/event planning.png',
  'entertainment': '/auto/music and arts.png',
  'weddings': '/auto/weddings.png',
  'tutoring': '/auto/ucational support.png',
  'skills': '/auto/skill.png',
  'music-arts': '/auto/music and arts.png',
  'special-needs': '/auto/special need education.png',
  'edu-support': '/auto/ucational support.png',
  'medical-home': '/auto/medical professional home visit.png',
  'alternative-medicine': '/auto/alternative medicine.png',
  'mental-health': '/auto/mental health.png',
  'fitness': '/auto/fitness and sport.png',
  'moving': '/auto/moving and relocation.png',
  'delivery': '/auto/delivery and courer.png',
  'rentals': '/auto/rentals.png',
  'social-groups': '/auto/social groups.png',
  'venues': '/auto/events space.png',
  'b2b-partners': '/auto/business partner B2B.png',
  'sme-services': '/auto/business services SME.png',
  'creative-partners': '/auto/creativeeconomy partner.png',
  'export': '/auto/export services.png',
  'import': '/auto/import services.png',
  'cross-border': '/auto/cross border trade.png',
};

// 🖼️ Subcategory custom PNGs – loads from /autolast/
const subcategoryPngMap: Record<number, string> = {
  // Vehicle Mechanics
  101: '/autolast/general motor machanic.png',
  102: '/autolast/Mercedes-Benz.png',
  103: '/autolast/toyota.png',
  104: '/autolast/honder.png',
  105: '/autolast/BMW.png',
  106: '/autolast/japan.png',
  107: '/autolast/KIV.png',
  108: '/autolast/china.png',
  109: '/autolast/diesel engine.png',
  110: '/autolast/petrol engine.png',
  111: '/autolast/gear box.png',
  112: '/autolast/engine reboring.png',
  113: '/autolast/car computer.png',
  114: '/autolast/car computer.png',
  115: '/autolast/village machanic.png',

  // Roadside Emergencies
  201: '/autolast/vehicle towing.png',
  202: '/autolast/trailer services.png',
  203: '/autolast/battary rescure.png',
  204: '/autolast/tire change.png',
  205: '/autolast/fuel delivery.png',
  206: '/autolast/lockout service.png',
  207: '/autolast/accident rescue.png',
  208: '/autolast/vehicle extrication.png',

  // Auto Repair Specialists
  301: '/autolast/air condition repair.png',
  302: '/autolast/radiator and cooling system.png',
  303: '/autolast/brake system specialist.png',
  304: '/autolast/suspension.png',
  305: '/autolast/car steering.png',
  306: '/autolast/exhaust.png',
  307: '/autolast/auto paint.png',
  308: '/autolast/panel beating.png',
  309: '/autolast/dent removal.png',
  310: '/autolast/car seat repair.png',
  311: '/autolast/windscreen repair.png',
  312: '/autolast/car key programming.png',

  // Auto Maintenance & Services
  401: '/autolast/oil change and lubrication.png',
  402: '/autolast/car wash and detailing.png',
  403: '/autolast/car polishing.png',
  404: '/autolast/engine flush.png',
  405: '/autolast/battry sales and installation.png',
  406: '/autolast/tire sales and rotation.png',
  407: '/autolast/wheel alignment services.png',
  409: '/autolast/wiper blade replacement.png',
  410: '/autolast/light replacement.png',
  411: '/autolast/pre travel vehicle inspection.png',

  // Auto Parts & Accessories
  501: '/autolast/original spare part.png',
  502: '/autolast/kumbo parts dealer.png',
  503: '/autolast/auto parts import.png',
  504: '/autolast/scrap yard auto dismantle.png',
  505: '/autolast/car audio and entertainment.png',
  506: '/autolast/car asseseries.png',
  507: '/autolast/car lighting.png',
  508: '/autolast/car battaries distributio.png',
  509: '/autolast/engine oil lubricate dealer.png',

  // Commercial Vehicles
  601: '/autolast/truck and trailer machanic.png',
  602: '/autolast/public transport mechanic.png',
  603: '/autolast/heavy duty equipment repair.png',
  604: '/autolast/forkleft repair and maintenace.png',
  605: '/autolast/generator machanic.png',
  606: '/autolast/tipper and truck services.png',

  // Official Vehicle Services
  701: '/autolast/FRSC services.png',
  702: '/autolast/vehicle license agent.png',
  703: '/autolast/driver license processing.png',
  704: '/autolast/vehicle verification agent.png',
  705: '/autolast/customer clearance agent.png',
  706: '/autolast/insurance assessors.png',

  // Plumbing & Water
  801: '/autolast/general plumbers.png',
  802: '/autolast/borehole drilling and installation.png',
  803: '/autolast/well digging services.png',
  804: '/autolast/water heater and installation.png',
};

// 🧠 Parent-category fallback Lucide icons
const parentCategoryIcons: Record<string, React.ReactNode> = {
  'vehicle-mechanics': <Wrench className="h-5 w-5" />,
  'roadside-emergencies': <Truck className="h-5 w-5" />,
  'auto-repair': <Wrench className="h-5 w-5" />,
  'auto-maintenance': <Wrench className="h-5 w-5" />,
  'auto-parts': <Wrench className="h-5 w-5" />,
  'commercial-vehicles': <Truck className="h-5 w-5" />,
  'official-vehicle': <Briefcase className="h-5 w-5" />,
  'plumbing': <Wrench className="h-5 w-5" />,
  'electrical': <Cable className="h-5 w-5" />,
  'construction': <Home className="h-5 w-5" />,
  'carpentry': <Home className="h-5 w-5" />,
  'painting': <PaintBucket className="h-5 w-5" />,
  'metal-works': <Wrench className="h-5 w-5" />,
  'glass': <GlassWater className="h-5 w-5" />,
  'appliance-repair': <Wrench className="h-5 w-5" />,
  'home-security': <Shield className="h-5 w-5" />,
  'medical-emergency': <Heart className="h-5 w-5" />,
  'fire-rescue': <Flame className="h-5 w-5" />,
  'security-guarding': <Shield className="h-5 w-5" />,
  'legal': <Briefcase className="h-5 w-5" />,
  'financial': <Briefcase className="h-5 w-5" />,
  'business': <Briefcase className="h-5 w-5" />,
  'real-estate': <Home className="h-5 w-5" />,
  'architecture': <PenTool className="h-5 w-5" />,
  'computer-it': <Monitor className="h-5 w-5" />,
  'mobile-phone': <Monitor className="h-5 w-5" />,
  'digital-creative': <Palette className="h-5 w-5" />,
  'printing': <Monitor className="h-5 w-5" />,
  'hair': <Scissors className="h-5 w-5" />,
  'makeup': <Sparkles className="h-5 w-5" />,
  'nail': <Scissors className="h-5 w-5" />,
  'spa': <Heart className="h-5 w-5" />,
  'fashion': <ShoppingBag className="h-5 w-5" />,
  'catering': <Utensils className="h-5 w-5" />,
  'private-chef': <Utensils className="h-5 w-5" />,
  'food-delivery': <Bike className="h-5 w-5" />,
  'drinks': <GlassWater className="h-5 w-5" />,
  'professional-food': <Utensils className="h-5 w-5" />,
  'photography': <Camera className="h-5 w-5" />,
  'event-planning': <Music className="h-5 w-5" />,
  'entertainment': <Music className="h-5 w-5" />,
  'weddings': <Heart className="h-5 w-5" />,
  'tutoring': <BookOpen className="h-5 w-5" />,
  'skills': <Lightbulb className="h-5 w-5" />,
  'music-arts': <Music className="h-5 w-5" />,
  'special-needs': <Brain className="h-5 w-5" />,
  'edu-support': <BookOpen className="h-5 w-5" />,
  'medical-home': <Stethoscope className="h-5 w-5" />,
  'alternative-medicine': <Brain className="h-5 w-5" />,
  'mental-health': <Brain className="h-5 w-5" />,
  'fitness': <Dumbbell className="h-5 w-5" />,
  'moving': <Truck className="h-5 w-5" />,
  'delivery': <Truck className="h-5 w-5" />,
  'rentals': <Key className="h-5 w-5" />,
  'social-groups': <Users className="h-5 w-5" />,
  'venues': <Users className="h-5 w-5" />,
  'b2b-partners': <Handshake className="h-5 w-5" />,
  'sme-services': <Handshake className="h-5 w-5" />,
  'creative-partners': <Handshake className="h-5 w-5" />,
  'export': <Upload className="h-5 w-5" />,
  'import': <Download className="h-5 w-5" />,
  'cross-border': <Plane className="h-5 w-5" />,
};

// Helper: returns subcategory icon – with explicit width/height
const getSubcategoryIcon = (sub: { slug?: string; id: number; name: string }, parentCategorySlug: string) => {
  const png = subcategoryPngMap[sub.id];
  if (png) return <img src={png} alt={sub.name} className="w-9 h-9 object-contain" width={36} height={36} />;

  if (parentCategorySlug && parentCategoryIcons[parentCategorySlug]) {
    return parentCategoryIcons[parentCategorySlug];
  }

  return <Tag className="h-5 w-5 text-gray-500" />;
};

export function MobileCategoryPanel({
  tierSlug,
  tierName,
  tierIcon,
  providerCounts,
  subcategoryCounts,
  onClose,
}: MobileCategoryPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.dispatchEvent(new Event('tierPanelOpened'));
    return () => window.dispatchEvent(new Event('tierPanelClosed'));
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const categories = CATEGORIES.filter(c => c.tier_slug === tierSlug);
  const currentCategory = selectedCategory ? categories.find(c => c.slug === selectedCategory) : null;
  const subs = currentCategory ? SUBCATEGORIES.filter(s => s.category_slug === currentCategory.slug) : [];

  // Helper: returns category icon with explicit width/height
  const getCategoryIcon = (slug: string, name: string) => {
    const png = categoryPngMap[slug];
    return png ? (
      <img src={png} alt={name} className="w-9 h-9 object-contain" width={36} height={36} />
    ) : (
      <div className="w-9 h-9 flex items-center justify-center text-white bg-primary-500 rounded-full text-sm font-bold">
        {name.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div ref={panelRef} className="relative w-full max-h-[70vh] bg-white/95 backdrop-blur-md rounded-t-2xl shadow-xl overflow-hidden flex flex-col" style={{ touchAction: 'pan-y' }}>
        <div className="sticky top-0 bg-primary-50/80 backdrop-blur-md border-b border-primary-100 flex items-center justify-between px-4 py-3 z-10">
          {selectedCategory ? (
            <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-1 text-sm text-primary-600 font-medium">
              <ChevronLeft className="h-5 w-5" />
              {currentCategory?.name}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {tierIcon ? (
                <img src={tierIcon} alt={tierName} className="w-9 h-9 object-contain" width={36} height={36} />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-sm font-bold">{tierName.charAt(0)}</div>
              )}
              <h3 className="font-semibold text-gray-900">{tierName}</h3>
            </div>
          )}
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {!selectedCategory ? (
            <div className="grid grid-cols-4 gap-3">
              {categories.map(cat => {
                const catCount = providerCounts[cat.slug] || 0;
                const hasSubs = SUBCATEGORIES.some(s => s.category_slug === cat.slug);
                const handleClick = () => {
                  if (hasSubs) setSelectedCategory(cat.slug);
                  else { window.location.href = `/search?category=${cat.slug}`; onClose(); }
                };
                return (
                  <button key={cat.slug} onClick={handleClick} className="flex flex-col items-center justify-center p-2 group">
                    <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mb-1 group-hover:bg-primary-100 transition-colors">
                      {getCategoryIcon(cat.slug, cat.name)}
                    </div>
                    <span className="text-[11px] font-medium text-gray-700 text-center leading-tight line-clamp-2">{cat.name}</span>
                    <span className="text-xs text-gray-400">{catCount} provider{catCount !== 1 ? 's' : ''}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {subs.map(sub => {
                const subCount = subcategoryCounts[sub.id] || 0;
                return (
                  <Link key={sub.id} href={`/search?subcategory=${sub.id}`} onClick={onClose} className="flex flex-col items-center justify-center p-2 group">
                    <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mb-1 group-hover:bg-primary-100 transition-colors">
                      {getSubcategoryIcon(sub, currentCategory?.slug || '')}
                    </div>
                    <span className="text-[11px] font-medium text-gray-700 text-center leading-tight line-clamp-2">{sub.name}</span>
                    <span className="text-xs text-gray-400">{subCount} provider{subCount !== 1 ? 's' : ''}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}