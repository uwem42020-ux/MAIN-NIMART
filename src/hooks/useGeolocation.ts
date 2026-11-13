// src/hooks/useGeolocation.ts
import { useEffect } from 'react';
import { useLocationStore } from '../stores/locationStore';

export function useGeolocation() {
  const { lat, lng, permissionGranted, permissionDenied, setLocation, setPermissionDenied } = useLocationStore();

  useEffect(() => {
    if (!navigator.geolocation) {
      if (!permissionGranted) setPermissionDenied();
      return;
    }

    // If the user explicitly denied permission before, don't keep asking them.
    if (permissionDenied) return;

    // 🔥 FIX: We removed the early return for `permissionGranted`.
    // If the user already granted permission, this will silently fetch fresh coords 
    // (using a 5-min cache so it doesn't drain battery).
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        // Only set denied if they actually blocked it. 
        // If it's just a timeout (error.code 3), keep the old cached coords.
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionDenied();
        }
      },
      {
        timeout: 10000,
        maximumAge: 1000 * 60 * 5, // Accept cached location up to 5 minutes old
      }
    );
  }, [permissionDenied, permissionGranted, setLocation, setPermissionDenied]);

  return { lat, lng, permissionGranted, permissionDenied };
}