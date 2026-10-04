// src/app/map/page.tsx
'use client';

import { MapView } from '@/components/map/MapView';

export default function MapPage() {
  return (
    <div className="min-h-screen">
      <MapView />
    </div>
  );
}