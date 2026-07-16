import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocationStore } from '../stores/locationStore';
import { db } from '@/lib/supabase-any';

export function useAutoLocation() {
  const { lat, lng, permissionGranted } = useLocationStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!permissionGranted || !lat || !lng) return;
    
    // Only run if no location filter is already set
    if (searchParams.get('state') || searchParams.get('lga')) return;

    const fetchNearestLGA = async () => {
      const { data, error } = await db
        .rpc('find_nearest_lga', {
          user_lat: lat,
          user_lng: lng,
        } as any);

      if (!error && data && (data as any[]).length > 0) {
        const nearest = (data as any[])[0];
        const params = new URLSearchParams(searchParams.toString());
        params.set('state', nearest.state_id.toString());
        params.set('lga', nearest.lga_id.toString());
        router.replace(`/search?${params.toString()}`);
      }
    };

    fetchNearestLGA();
  }, [permissionGranted, lat, lng]);
}