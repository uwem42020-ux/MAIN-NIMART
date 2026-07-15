import { useEffect } from 'react';
import { useLocationStore } from '../stores/locationStore';
import { supabase } from '../lib/supabase';
import { useSearchParams } from 'react-router-dom';

export function useAutoLocation() {
  const { lat, lng, permissionGranted } = useLocationStore();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!permissionGranted || !lat || !lng) return;
    
    // Only run if no location filter is already set
    if (searchParams.get('state') || searchParams.get('lga')) return;

    const fetchNearestLGA = async () => {
      const { data, error } = await supabase
        .rpc('find_nearest_lga', {
          user_lat: lat,
          user_lng: lng
        });

      if (!error && data && data.length > 0) {
        const nearest = data[0];
        const params = new URLSearchParams(searchParams);
        params.set('state', nearest.state_id.toString());
        params.set('lga', nearest.lga_id.toString());
        setSearchParams(params, { replace: true });
      }
    };

    fetchNearestLGA();
  }, [permissionGranted, lat, lng]);
}