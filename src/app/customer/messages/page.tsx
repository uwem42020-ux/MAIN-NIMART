// src/app/customer/messages/page.tsx
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import Link from 'next/link';
import { MessageCircle, Search, MoreVertical, Trash2, Pin, EyeOff } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import toast from 'react-hot-toast';

export default function CustomerMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data: threads, isLoading } = useQuery({
    queryKey: ['customer-threads', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: threadData } = await db
        .from('threads')
        .select('id, provider_id, customer_id, last_message, last_message_at')
        .eq('customer_id', user.id)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (!threadData?.length) return [];

      const providerIds = (threadData as any[]).map((t: any) => t.provider_id);
      const { data: profilesData } = await db
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', providerIds);

      const profileMap = new Map((profilesData as any[])?.map((p: any) => [p.id, p]) || []);

      return (threadData as any[]).map((t: any) => ({
        id: t.id,
        last_message: t.last_message,
        last_message_at: t.last_message_at,
        other_participant: profileMap.get(t.provider_id) || { full_name: 'Unknown User', avatar_url: null },
      }));
    },
    enabled: !!user,
    staleTime: 0,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('customer-threads-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threads', filter: `customer_id=eq.${user.id}` }, () =>
        queryClient.invalidateQueries({ queryKey: ['customer-threads', user.id] })
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () =>
        queryClient.invalidateQueries({ queryKey: ['customer-threads', user.id] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel).catch(console.warn); };
  }, [user, queryClient]);

  const formatTime = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const filteredThreads = threads?.filter((t: any) =>
    t.other_participant.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteThread = async (threadId: string) => {
    if (!confirm('Delete this entire conversation?')) return;
    await db.from('messages').delete().eq('thread_id', threadId);
    await db.from('threads').delete().eq('id', threadId);
    queryClient.invalidateQueries({ queryKey: ['customer-threads', user?.id] });
    setOpenMenuId(null);
    toast.success('Conversation deleted');
  };

  const handlePinChat = (threadId: string) => {
    toast.success('Pin feature coming soon');
    setOpenMenuId(null);
  };

  const handleMarkUnread = (threadId: string) => {
    toast.success('Marked as unread (simulated)');
    setOpenMenuId(null);
  };

  if (isLoading) return <div className="flex justify-center py-12"><NimartSpinner size="md" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 h-[calc(100vh-64px)] flex flex-col">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>

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

      {!filteredThreads?.length ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12 bg-gray-50 rounded-xl">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500 font-medium">No conversations yet</p>
          <Link href="/search" className="mt-2 text-primary-600 hover:underline text-sm">Find a provider to message</Link>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredThreads.map((t: any) => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-100 relative group">
              <Link href={`/customer/messages/${t.id}`} className="flex items-center gap-4 px-4 py-3 pr-10 hover:bg-gray-50 transition rounded-xl">
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
                  onClick={(e) => { e.preventDefault(); setOpenMenuId(openMenuId === t.id ? null : t.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded-full transition"
                >
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </button>
                {openMenuId === t.id && (
                  <div className="absolute right-0 mt-1 bg-white rounded-xl shadow-lg border py-2 w-48 z-50">
                    <button onClick={() => handleDeleteThread(t.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-500 flex items-center gap-2">
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                    <button onClick={() => handlePinChat(t.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Pin className="h-4 w-4" /> Pin chat
                    </button>
                    <button onClick={() => handleMarkUnread(t.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                      <EyeOff className="h-4 w-4" /> Mark unread
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}