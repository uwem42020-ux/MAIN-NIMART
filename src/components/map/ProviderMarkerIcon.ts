// src/components/map/ProviderMarkerIcon.ts
import L from 'leaflet';

export function createProviderMarkerIcon(
  status: 'available' | 'busy' | 'away',
  avatarUrl?: string | null,
  isSelected = false
) {
  const size = isSelected ? 52 : 42;
  const borderColor = isSelected ? '#008751' : 'white';
  const borderWidth = isSelected ? 3 : 2;

  const statusColors: Record<string, string> = {
    available: '#22c55e',
    busy: '#eab308',
    away: '#ef4444',
  };

  const statusColor = statusColors[status] || '#6b7280';

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px;">
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        overflow: hidden;
        border: ${borderWidth}px solid ${borderColor};
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        background: #f3f4f6;
      ">
        ${avatarUrl
          ? `<img src="${avatarUrl}" alt="" style="width:100%;height:100%;object-fit:cover;" />`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:${size * 0.4}px;font-weight:600;color:#008751;">?</div>`
        }
      </div>
      <div style="
        position: absolute;
        bottom: 0;
        right: 0;
        width: ${size * 0.33}px;
        height: ${size * 0.33}px;
        background: ${statusColor};
        border: 2px solid white;
        border-radius: 50%;
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'provider-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}