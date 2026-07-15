// src/components/common/CategorySidebar.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRight, ChevronDown, ChevronUp, Wrench, Monitor, Scissors, Home,
  Truck, Briefcase, Shield, Heart, BookOpen, Music, Users, Handshake,
  Globe, Utensils, Camera, Bike, Car, Flame, Lightbulb, GlassWater,
  PaintBucket, Dumbbell, Stethoscope, Brain, Plane, Download, Upload,
  ShoppingBag, Sparkles, Key, PenTool, Palette, Cable, Drill, Tag
} from 'lucide-react';
import { TIERS, CATEGORIES, SUBCATEGORIES } from '@/data/categories';
import { cn } from '@/lib/utils';

// Tier icons (unchanged)
const tierIconMap: Record<string, string> = {
  automotive: '/categoryicons/roadside.png',
  'home-property': '/categoryicons/home.png',
  emergency: '/categoryicons/safety.png',
  professional: '/categoryicons/services.png',
  technology: '/categoryicons/technology.png',
  beauty: '/categoryicons/beauty.png',
  food: '/categoryicons/food.png',
  events: '/categoryicons/event.png',
  education: '/categoryicons/education.png',
  health: '/categoryicons/health.png',
  logistics: '/categoryicons/logistics.png',
  social: '/categoryicons/social.png',
  'business-partners': '/categoryicons/partner&support.png',
  trade: '/categoryicons/export.png',
};

// Category PNGs (matching MobileCategoryPanel) – unchanged
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

// Subcategory PNGs – unchanged
const subcategoryPngMap: Record<number, string> = {
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
  201: '/autolast/vehicle towing.png',
  202: '/autolast/trailer services.png',
  203: '/autolast/battary rescure.png',
  204: '/autolast/tire change.png',
  205: '/autolast/fuel delivery.png',
  206: '/autolast/lockout service.png',
  207: '/autolast/accident rescue.png',
  208: '/autolast/vehicle extrication.png',
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
  401: '/autolast/oil change and lubrication.png',
  402: '/autolast/car wash and detailing.png',
  403: '/autolast/car polishing.png',
  404: '/autolast/engine flush.png',
  405: '/autolast/battary sales and installation.png',
  406: '/autolast/tire sales and rotation.png',
  407: '/autolast/wheel alignment services.png',
  409: '/autolast/wiper blade replacement.png',
  410: '/autolast/light replacement.png',
  411: '/autolast/pre travel vehicle inspection.png',
  501: '/autolast/original spare part.png',
  502: '/autolast/kumbo parts dealer.png',
  503: '/autolast/auto parts import.png',
  504: '/autolast/scrap yard auto dismantle.png',
  505: '/autolast/car audio and entertainment.png',
  506: '/autolast/car asseseries.png',
  507: '/autolast/car lighting.png',
  508: '/autolast/car battaries distributio.png',
  509: '/autolast/engine oil lubricate dealer.png',
  601: '/autolast/truck and trailer machanic.png',
  602: '/autolast/public transport mechanic.png',
  603: '/autolast/heavy duty equipment repair.png',
  604: '/autolast/forkleft repair and maintenace.png',
  605: '/autolast/generator machanic.png',
  606: '/autolast/tipper and truck services.png',
  701: '/autolast/FRSC services.png',
  702: '/autolast/vehicle license agent.png',
  703: '/autolast/driver license processing.png',
  704: '/autolast/vehicle verification agent.png',
  705: '/autolast/customer clearance agent.png',
  706: '/autolast/insurance assessors.png',
  801: '/autolast/general plumbers.png',
  802: '/autolast/borehole drilling and installation.png',
  803: '/autolast/well digging services.png',
  804: '/autolast/water heater and installation.png',
};

// Lucide fallback icons per category – unchanged
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

// Helper: returns the icon element for a category
const getCategoryIconElement = (catSlug: string, catName: string) => {
  const png = categoryPngMap[catSlug];
  if (png)
    return (
      <img
        src={png}
        alt={catName}
        className="w-6 h-6 object-contain"
        width={24}
        height={24}
      />
    );
  return (
    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-medium">
      {catName.charAt(0).toUpperCase()}
    </div>
  );
};

// Helper: returns the icon element for a subcategory
const getSubcategoryIconElement = (
  subId: number,
  subName: string,
  parentCategorySlug: string
) => {
  const png = subcategoryPngMap[subId];
  if (png)
    return (
      <img
        src={png}
        alt={subName}
        className="w-5 h-5 object-contain"
        width={20}
        height={20}
      />
    );
  if (parentCategorySlug && parentCategoryIcons[parentCategorySlug]) {
    return parentCategoryIcons[parentCategorySlug];
  }
  return <Tag className="h-4 w-4 text-gray-400" />;
};

interface CategorySidebarProps {
  providerCounts: Record<string, number>;
  subcategoryCounts: Record<number, number>;
}

export function CategorySidebar({
  providerCounts,
  subcategoryCounts,
}: CategorySidebarProps) {
  const [hoveredTier, setHoveredTier] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);

  const visibleTiers = expanded ? TIERS : TIERS.slice(0, 7);

  const currentCategories = hoveredTier
    ? CATEGORIES.filter(c => c.tier_slug === hoveredTier)
    : [];
  const currentSubcategories = hoveredCategory
    ? SUBCATEGORIES.filter(s => s.category_slug === hoveredCategory)
    : [];

  const getTierCount = (tierSlug: string) => {
    const cats = CATEGORIES.filter(c => c.tier_slug === tierSlug);
    return cats.reduce((sum, cat) => sum + (providerCounts[cat.slug] || 0), 0);
  };

  const scheduleClose = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    closeTimeout.current = setTimeout(() => {
      setHoveredTier(null);
      setHoveredCategory(null);
    }, 100);
  };

  const cancelClose = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
  };

  useEffect(() => {
    return () => {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    };
  }, []);

  const handleMouseEnterTier = (tierSlug: string) => {
    cancelClose();
    setHoveredTier(tierSlug);
    setHoveredCategory(null);
  };

  const handleMouseEnterCategory = (catSlug: string) => {
    cancelClose();
    setHoveredCategory(catSlug);
  };

  const handleMouseLeaveSidebar = () => {
    scheduleClose();
  };

  const hoveredTierObj = hoveredTier
    ? TIERS.find(t => t.slug === hoveredTier)
    : null;
  const hoveredCategoryObj = hoveredCategory
    ? currentCategories.find(c => c.slug === hoveredCategory)
    : null;

  return (
    <div className="relative" onMouseLeave={handleMouseLeaveSidebar}>
      {/* Main tier list */}
      <div className="bg-white/80 backdrop-blur-md rounded-lg shadow-sm border border-gray-200/50 w-64">
        <div className="overflow-y-auto max-h-[calc(100vh-80px)]">
          <div className="pt-1">
            {visibleTiers.map(tier => (
              <div
                key={tier.slug}
                onMouseEnter={() => handleMouseEnterTier(tier.slug)}
                className="relative"
              >
                <Link
                  href={`/search?tier=${tier.slug}`}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 hover:bg-gray-50/50 transition-colors',
                    hoveredTier === tier.slug &&
                      'bg-primary-50/80 text-primary-700'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={tierIconMap[tier.slug]}
                      alt={tier.name}
                      className="w-7 h-7 object-contain"
                      width={28}
                      height={28}
                    />
                    <div>
                      <span className="text-sm font-medium block">
                        {tier.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {getTierCount(tier.slug)} provider
                        {getTierCount(tier.slug) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </Link>
              </div>
            ))}

            {!expanded && TIERS.length > 7 && (
              <button
                onClick={() => setExpanded(true)}
                className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm text-primary-600 hover:bg-gray-50/50 transition-colors border-t border-gray-100"
              >
                <ChevronDown className="h-4 w-4" />
                More Categories
              </button>
            )}
            {expanded && (
              <button
                onClick={() => setExpanded(false)}
                className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm text-primary-600 hover:bg-gray-50/50 transition-colors border-t border-gray-100"
              >
                <ChevronUp className="h-4 w-4" />
                Show Less
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Flyout for categories */}
      {hoveredTier && currentCategories.length > 0 && (
        <div
          className="absolute top-0 w-64 bg-white/80 backdrop-blur-md rounded-r-lg shadow-lg border border-gray-200/50 z-50 overflow-hidden flex flex-col"
          style={{
            height: 'calc(100vh - 80px)',
            left: 'calc(16rem + 0.25rem)',
          }}
          onMouseEnter={() => {
            cancelClose();
            setHoveredTier(hoveredTier);
          }}
          onMouseLeave={scheduleClose}
        >
          <div className="sticky top-0 bg-primary-50/80 backdrop-blur-md border-b border-primary-100 flex items-center gap-3 px-3 py-2.5">
            {hoveredTierObj && (
              <img
                src={tierIconMap[hoveredTierObj.slug]}
                alt={hoveredTierObj.name}
                className="w-7 h-7 object-contain"
                width={28}
                height={28}
              />
            )}
            <h3 className="font-semibold text-gray-900 text-sm">
              {hoveredTierObj?.name}
            </h3>
          </div>
          <div className="overflow-y-auto flex-1">
            {currentCategories.map(cat => {
              const catCount = providerCounts[cat.slug] || 0;
              const hasSubs = SUBCATEGORIES.some(
                s => s.category_slug === cat.slug
              );
              return (
                <div
                  key={cat.slug}
                  onMouseEnter={() => handleMouseEnterCategory(cat.slug)}
                  className="relative"
                >
                  <Link
                    href={hasSubs ? '#' : `/search?category=${cat.slug}`}
                    onClick={e => {
                      if (hasSubs) e.preventDefault();
                    }}
                    className={cn(
                      'flex items-center justify-between px-3 py-2.5 hover:bg-gray-50/50 transition-colors',
                      hoveredCategory === cat.slug &&
                        'bg-primary-50/80 text-primary-700'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {getCategoryIconElement(cat.slug, cat.name)}
                      <span className="text-sm">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {catCount} provider{catCount !== 1 ? 's' : ''}
                      </span>
                      {hasSubs && (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Flyout for subcategories */}
      {hoveredCategory && currentSubcategories.length > 0 && (
        <div
          className="absolute top-0 w-64 bg-white/80 backdrop-blur-md rounded-r-lg shadow-lg border border-gray-200/50 z-50 overflow-hidden flex flex-col"
          style={{
            height: 'calc(100vh - 80px)',
            left: 'calc(32rem + 0.5rem)',
          }}
          onMouseEnter={() => {
            cancelClose();
            setHoveredCategory(hoveredCategory);
          }}
          onMouseLeave={scheduleClose}
        >
          <div className="sticky top-0 bg-primary-50/80 backdrop-blur-md border-b border-primary-100 flex items-center px-3 py-2.5">
            <h3 className="font-semibold text-gray-900 text-sm">
              {hoveredCategoryObj?.name}
            </h3>
          </div>
          <div className="overflow-y-auto flex-1">
            {currentSubcategories.map(sub => {
              const subCount = subcategoryCounts[sub.id] || 0;
              return (
                <Link
                  key={sub.id}
                  href={`/search?subcategory=${sub.id}`}
                  className="flex items-center justify-between px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50/50 hover:text-primary-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {getSubcategoryIconElement(
                      sub.id,
                      sub.name,
                      hoveredCategoryObj?.slug || ''
                    )}
                    <span>{sub.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {subCount} provider{subCount !== 1 ? 's' : ''}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}