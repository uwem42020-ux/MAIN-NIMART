// src/components/common/DraggableMap.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { GoogleMap, LoadScript, MarkerF } from '@react-google-maps/api';

interface DraggableMapProps {
  centerLat: number;
  centerLng: number;
  markerLat: number;
  markerLng: number;
  onMarkerDrag: (lat: number, lng: number) => void;
  height?: string;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = { lat: 9.0556, lng: 7.4914 };

export function DraggableMap({
  centerLat,
  centerLng,
  markerLat,
  markerLng,
  onMarkerDrag,
  height = '300px',
}: DraggableMapProps) {
  const [position, setPosition] = useState<google.maps.LatLngLiteral>({
    lat: markerLat || defaultCenter.lat,
    lng: markerLng || defaultCenter.lng,
  });
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (markerLat && markerLng) {
      setPosition({ lat: markerLat, lng: markerLng });
    }
  }, [markerLat, markerLng]);

  const handleDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const newLat = e.latLng!.lat();
      const newLng = e.latLng!.lng();
      setPosition({ lat: newLat, lng: newLng });
      onMarkerDrag(newLat, newLng);
    },
    [onMarkerDrag]
  );

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const newLat = e.latLng!.lat();
      const newLng = e.latLng!.lng();
      setPosition({ lat: newLat, lng: newLng });
      onMarkerDrag(newLat, newLng);
    },
    [onMarkerDrag]
  );

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

  if (!apiKey) {
    return (
      <div style={{ height, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', borderRadius: '0.5rem' }}>
        <p className="text-gray-500 text-sm">Google Maps API key missing</p>
      </div>
    );
  }

  return (
    <div style={{ height, width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}>
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={position}
          zoom={15}
          onLoad={onLoad}
          onClick={handleMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
          }}
        >
          <MarkerF
            position={position}
            draggable={true}
            onDragEnd={handleDragEnd}
          />
        </GoogleMap>
      </LoadScript>
    </div>
  );
};