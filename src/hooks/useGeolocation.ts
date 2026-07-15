import { useEffect } from 'react';
import { useLocationStore } from '../stores/locationStore';

export function useGeolocation() {
  const { lat, lng, permissionGranted, permissionDenied, setLocation, setPermissionDenied } = useLocationStore();

  useEffect(() => {
    // Skip if already granted or denied
    if (permissionGranted || permissionDenied) return;
    if (!navigator.geolocation) {
      setPermissionDenied();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setPermissionDenied();
      },
      { timeout: 10000 }
    );
  }, [permissionGranted, permissionDenied, setLocation, setPermissionDenied]);

  return { lat, lng, permissionGranted, permissionDenied };
}