import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationState {
  lat: number | null;
  lng: number | null;
  permissionGranted: boolean;
  permissionDenied: boolean;
  setLocation: (lat: number, lng: number) => void;
  setPermissionDenied: () => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      lat: null,
      lng: null,
      permissionGranted: false,
      permissionDenied: false,
      setLocation: (lat, lng) => set({ lat, lng, permissionGranted: true, permissionDenied: false }),
      setPermissionDenied: () => set({ permissionDenied: true, permissionGranted: false }),
      clearLocation: () => set({ lat: null, lng: null, permissionGranted: false, permissionDenied: false }),
    }),
    {
      name: 'nimart-location',
    }
  )
);