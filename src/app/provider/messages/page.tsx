// src/app/provider/messages/page.tsx
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { MessageCircle, RefreshCw, Search, MoreVertical, Trash2, Pin, EyeOff } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { useEffect, useState, useRef } from 'react';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import toast from 'react-hot-toast';

export default function ProviderMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [menuState, setMenuState] = useState<{ id: string; top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: threads, isLoading, refetch } = useQuery({
    queryKey: ['provider-threads', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: threadData } = await supabase
        .from('threads')
        .select('id, provider_id, customer_id, last_message, last_message_at')
        .or(`provider_id.eq.${user.id},customer_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (!threadData?.length) return [];

      const otherIds = threadData.map(t =>
        t.provider_id === user.id ? t.customer_id : t.provider_id
      );
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', otherIds);

      const profileMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      return threadData.map(t => ({
        id: t.id,
        last_message: t.last_message,
        last_message_at: t.last_message_at,
        other_participant: profileMap.get(
          t.provider_id === user.id ? t.customer_id : t.provider_id
        ) || { full_name: 'Unknown User', avatar_url: null },
      }));
    },
    enabled: !!user,
    staleTime: 0,
  });

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;
    const channelProvider = supabase
      .channel('provider-threads-provider')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threads', filter: `provider_id=eq.${user.id}` }, () =>
        queryClient.invalidateQueries({ queryKey: ['provider-threads', user.id] })
      )
      .subscribe();
    const channelCustomer = supabase
      .channel('provider-threads-customer')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threads', filter: `customer_id=eq.${user.id}` }, () =>
        queryClient.invalidateQueries({ queryKey: ['provider-threads', user.id] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channelProvider).catch(console.warn);
      supabase.removeChannel(channelCustomer).catch(console.warn);
    };
  }, [user, queryClient]);

  const formatTime = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const filteredThreads = threads?.filter(t =>
    t.other_participant.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const openMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuState({ id, top: rect.bottom + 8, left: rect.right - 176 });
  };

  const closeMenu = () => setMenuState(null);

  // FIXED: Delete thread (messages cascade automatically due to ON DELETE CASCADE)
  const handleDeleteThread = async (threadId: string) => {
    if (!confirm('Delete this entire conversation? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('threads').delete().eq('id', threadId);
      if (error) {
        console.error('Delete error:', error);
        toast.error('Could not delete conversation: ' + error.message);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['provider-threads', user?.id] });
      closeMenu();
      toast.success('Conversation deleted');
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Unexpected error while deleting');
    }
  };

  const handlePinChat = () => {
    toast.success('Pin feature coming soon');
    closeMenu();
  };

  const handleMarkUnread = () => {
    toast.success('Marked as unread (simulated)');
    closeMenu();
  };

  if (isLoading) return <div className="flex justify-center py-12"><NimartSpinner size="md" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 h-[calc(100vh-64px)] flex flex-col" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <button onClick={() => refetch()} className="p-2 text-gray-500 hover:text-primary-600 rounded-full hover:bg-gray-100 transition" title="Refresh">
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {!filteredThreads?.length ? (
          <div className="flex flex-col items-center justify-center text-center py-12 bg-gray-50 rounded-xl">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500 font-medium">No conversations yet</p>
            <p className="mt-1 text-gray-400 text-sm">When customers message you, they'll appear here</p>
          </div>
        ) : (
          filteredThreads.map((t) => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-100 relative group">
              <Link
                href={`/provider/messages/${t.id}`}
                className="flex items-center gap-4 px-4 py-3 pr-10 hover:bg-gray-50 transition rounded-xl"
              >
                {t.other_participant.avatar_url ? (
                  <img src={t.other_participant.avatar_url} alt={t.other_participant.full_name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-lg">{t.other_participant.full_name?.[0] || '?'}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h2 className="text-sm font-semibold text-gray-900 truncate">{t.other_participant.full_name}</h2>
                    {t.last_message_at && <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">{formatTime(t.last_message_at)}</span>}
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-0.5">{t.last_message || 'No messages yet'}</p>
                </div>
              </Link>

              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <button
                  onClick={(e) => openMenu(t.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded-full transition"
                >
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Context menu */}
      {menuState && (
        <div className="fixed inset-0 z-50" onClick={closeMenu} onContextMenu={(e) => e.preventDefault()}>
          <div
            className="absolute bg-white rounded-xl shadow-lg border py-2 w-48"
            style={{ top: menuState.top, left: menuState.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleDeleteThread(menuState.id)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-500 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
            <button
              onClick={handlePinChat}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Pin className="h-4 w-4" /> Pin chat
            </button>
            <button
              onClick={handleMarkUnread}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <EyeOff className="h-4 w-4" /> Mark unread
            </button>
          </div>
        </div>
      )}
    </div>
  );
}