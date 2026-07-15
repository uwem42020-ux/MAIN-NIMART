// src/components/common/DraggableMap.tsx
import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon paths in Leaflet with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface DraggableMapProps {
  centerLat: number;
  centerLng: number;
  markerLat: number;
  markerLng: number;
  onMarkerDrag: (lat: number, lng: number) => void;
  height?: string;
}

// Component to handle map events and marker dragging
function MapEventHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export function DraggableMap({
  centerLat,
  centerLng,
  markerLat,
  markerLng,
  onMarkerDrag,
  height = '300px',
}: DraggableMapProps) {
  const [position, setPosition] = useState<[number, number]>([markerLat, markerLng]);

  useEffect(() => {
    setPosition([markerLat, markerLng]);
  }, [markerLat, markerLng]);

  const handleDragEnd = useCallback(
    (e: L.LeafletEvent) => {
      const marker = e.target as L.Marker;
      const latlng = marker.getLatLng();
      const lat = parseFloat(latlng.lat.toFixed(6));
      const lng = parseFloat(latlng.lng.toFixed(6));
      setPosition([lat, lng]);
      onMarkerDrag(lat, lng);
    },
    [onMarkerDrag]
  );

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setPosition([lat, lng]);
      onMarkerDrag(lat, lng);
    },
    [onMarkerDrag]
  );

  return (
    <div style={{ height, width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}>
      <MapContainer
        center={[markerLat || centerLat, markerLng || centerLng]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={[markerLat || centerLat, markerLng || centerLng]} zoom={15} />
        <Marker
          position={position}
          draggable={true}
          eventHandlers={{ dragend: handleDragEnd }}
        />
        <MapEventHandler onClick={handleMapClick} />
      </MapContainer>
    </div>
  );
}