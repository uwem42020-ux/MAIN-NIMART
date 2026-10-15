// src/contexts/NotificationContext.tsx
'use client';

import React, { createContext, useContext, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface NotificationCounts {
  bookings: number;
  messages: number;
  system: number;
}

interface NotificationContextType {
  counts: NotificationCounts;
  totalCount: number;
  markBookingsAsSeen: () => Promise<void>;
  markMessagesAsSeen: () => Promise<void>;
  markSystemAsSeen: () => Promise<void>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Fetch counts, capability-gated.
// - bookings as provider: only if isProvider
// - bookings as customer: only if isCustomer
// - messages / system: user-id-scoped, always fetched
//
// Badge meaning: bookings count = ACTIONABLE bookings (pending + confirmed),
// not unread. This is intentional and preserved from the pre-migration logic.
async function fetchCounts(
  userId: string,
  isCustomer: boolean,
  isProvider: boolean,
): Promise<NotificationCounts> {
  const bookingsProviderPromise = isProvider
    ? db
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('provider_id', userId)
        .in('status', ['pending', 'confirmed'])
    : Promise.resolve({ count: 0 } as any);

  const bookingsCustomerPromise = isCustomer
    ? db
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', userId)
        .in('status', ['pending', 'confirmed'])
    : Promise.resolve({ count: 0 } as any);

  const [bookingsAsProvider, bookingsAsCustomer, messagesRes, systemRes] = await Promise.all([
    bookingsProviderPromise,
    bookingsCustomerPromise,
    db
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false),
    db
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false),
  ]);

  return {
    bookings: (bookingsAsProvider.count || 0) + (bookingsAsCustomer.count || 0),
    messages: messagesRes.count || 0,
    system: systemRes.count || 0,
  };
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isCustomer, isProvider } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Query key includes a 'v2' version suffix so stale caches from the
  // pre-migration count logic don't leak into the new shape.
  const queryKey = ['notification-counts', userId, isProvider, isCustomer, 'v2'] as const;

  const { data: counts = { bookings: 0, messages: 0, system: 0 }, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchCounts(userId!, isCustomer, isProvider),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: 'always',
  });

  const totalCount = counts.bookings + counts.messages + counts.system;

  // Debounce bursts of realtime events into a single invalidation.
  // A busy provider might receive 5 bookings in 30 seconds — we don't
  // want 5 refetches and a flickering badge.
  const dirtyRef = useRef(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current) {
        queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
        dirtyRef.current = false;
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [queryClient]);

  React.useEffect(() => {
    if (!userId) return;
    if (!isCustomer && !isProvider) return;

    const markDirty = () => {
      dirtyRef.current = true;
    };

    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Provider-side bookings channel — only if user has provider capability.
    if (isProvider) {
      channels.push(
        supabase
          .channel('bookings-count-provider')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'bookings',
              filter: `provider_id=eq.${userId}`,
            },
            markDirty,
          )
          .subscribe(),
      );
    }

    // Customer-side bookings channel — only if user has customer capability.
    if (isCustomer) {
      channels.push(
        supabase
          .channel('bookings-count-customer')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'bookings',
              filter: `customer_id=eq.${userId}`,
            },
            markDirty,
          )
          .subscribe(),
      );
    }

    // Messages — role-independent, always subscribed.
    channels.push(
      supabase
        .channel('messages-count')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${userId}`,
          },
          markDirty,
        )
        .subscribe(),
    );

    // System notifications — role-independent, always subscribed.
    channels.push(
      supabase
        .channel('notifications-count')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            markDirty();
            if (payload.eventType === 'INSERT') {
              const notif = payload.new;
              toast(notif.title as string, { icon: '🔔' } as any);
            }
          },
        )
        .subscribe(),
    );

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch).catch(console.warn));
    };
  }, [userId, isCustomer, isProvider, queryClient]);

  const markMessagesAsSeen = async () => {
    if (!userId) return;

    queryClient.setQueryData(queryKey, (old: any) => ({
      ...old,
      messages: 0,
    }));

    const { error } = await db
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() } as any)
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
    }
  };

  const markBookingsAsSeen = async () => {
    if (!userId) return;
    queryClient.setQueryData(queryKey, (old: any) => ({
      ...old,
      bookings: 0,
    }));
  };

  const markSystemAsSeen = async () => {
    if (!userId) return;
    queryClient.setQueryData(queryKey, (old: any) => ({
      ...old,
      system: 0,
    }));
    const { error } = await db
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() } as any)
      .eq('user_id', userId)
      .eq('is_read', false);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
    }
  };

  const value = {
    counts,
    totalCount,
    markBookingsAsSeen,
    markMessagesAsSeen,
    markSystemAsSeen,
    isLoading,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}