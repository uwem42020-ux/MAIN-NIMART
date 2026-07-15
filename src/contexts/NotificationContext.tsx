'use client';

import React, { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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

async function fetchCounts(userId: string, role: string): Promise<NotificationCounts> {
  const [bookingsRes, messagesRes, systemRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq(role === 'provider' ? 'provider_id' : 'customer_id', userId)
      .in('status', ['pending', 'confirmed']),
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false),
  ]);

  return {
    bookings: bookingsRes.count || 0,
    messages: messagesRes.count || 0,
    system: systemRes.count || 0,
  };
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const role = profile?.role;

  const { data: counts = { bookings: 0, messages: 0, system: 0 }, isLoading } = useQuery({
    queryKey: ['notification-counts', userId, role],
    queryFn: () => fetchCounts(userId!, role!),
    enabled: !!userId && !!role,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: 'always',
  });

  const totalCount = counts.bookings + counts.messages + counts.system;

  React.useEffect(() => {
    if (!userId || !role) return;

    const channels = [
      supabase
        .channel('bookings-count')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: role === 'provider' ? `provider_id=eq.${userId}` : `customer_id=eq.${userId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['notification-counts', userId, role] });
          }
        )
        .subscribe(),
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
          () => {
            queryClient.invalidateQueries({ queryKey: ['notification-counts', userId, role] });
          }
        )
        .subscribe(),
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
            queryClient.invalidateQueries({ queryKey: ['notification-counts', userId, role] });
            if (payload.eventType === 'INSERT') {
              const notif = payload.new;
              toast(notif.title, { description: notif.body, icon: '🔔' });
            }
          }
        )
        .subscribe(),
    ];

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch).catch(console.warn));
    };
  }, [userId, role, queryClient]);

  const markMessagesAsSeen = async () => {
    if (!userId) return;

    queryClient.setQueryData(['notification-counts', userId, role], (old: any) => ({
      ...old,
      messages: 0,
    }));

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['notification-counts', userId, role] });
    }
  };

  const markBookingsAsSeen = async () => {
    if (!userId) return;
    // Bookings don't have a "seen" flag – only reset UI
    queryClient.setQueryData(['notification-counts', userId, role], (old: any) => ({
      ...old,
      bookings: 0,
    }));
  };

  const markSystemAsSeen = async () => {
    if (!userId) return;
    queryClient.setQueryData(['notification-counts', userId, role], (old: any) => ({
      ...old,
      system: 0,
    }));
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['notification-counts', userId, role] });
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