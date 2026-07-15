import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useRealtime<T = any>(
  table: string,
  filter: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*',
  callback: (payload: { new: T; old: T; eventType: string }) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    channelRef.current = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event, schema: 'public', table, filter },
        (payload) => {
          callback({
            new: payload.new as T,
            old: payload.old as T,
            eventType: payload.eventType,
          });
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, filter, event, callback]);
}