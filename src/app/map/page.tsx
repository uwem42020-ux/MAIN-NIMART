// src/app/map/page.tsx
'use client';

import { MapView } from '@/components/map/MapView';
import { SEO } from '@/components/common/SEO';

export default function MapPage() {
  return (
    <>
      <SEO
        title="Explore Service Providers on Map"
        description="Discover verified service providers near you on the interactive map. Find mechanics, hairdressers, electricians and more."
        url="https://nimart.ng/map"
      />
      <div className="min-h-screen">
        <MapView />
      </div>
    </>
  );
}