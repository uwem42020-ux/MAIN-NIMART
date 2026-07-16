// src/components/chat/MessageThread.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import {
  ArrowLeft,
  Send,
  Paperclip,
  XCircle,
  Image,
  File,
  CheckCheck,
  Check,
  X,
  MoreVertical,
  BookOpen,
  Flag,
  Star,
} from 'lucide-react';
import { format, isToday, isThisWeek, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string | null;
  sender_id: string;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  is_read?: boolean;
  deleted_at?: string | null;
  edited_at?: string | null;
}

const formatMessageTime = (dateStr: string) => {
  const date = parseISO(dateStr);
  if (isToday(date)) return format(date, 'h:mm a');
  if (isThisWeek(date, { weekStartsOn: 1 })) return format(date, 'EEE h:mm a');
  return format(date, 'MMM d, h:mm a');
};

interface MessageThreadProps {
  threadId: string;
}

export function MessageThread({ threadId }: MessageThreadProps) {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ message: Message; x: number; y: number } | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['thread', threadId],
    queryFn: async () => {
      if (!threadId || !user) return null;
      const { data: threadData } = await db
        .from('threads')
        .select('*')
        .eq('id', threadId)
        .single();
      if (!threadData) return null;

      const thread = threadData as any;
      const otherId = thread.provider_id === user.id ? thread.customer_id : thread.provider_id;
      const [{ data: messagesData }, { data: profileData }] = await Promise.all([
        db.from('messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true }),
        db.from('profiles').select('full_name, avatar_url, role').eq('id', otherId).single(),
      ]);

      return {
        thread,
        otherParticipant: (profileData as any) ?? { full_name: 'Unknown', avatar_url: null, role: null },
        messages: (messagesData || []) as Message[],
      };
    },
    enabled: !!threadId && !!user,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [data?.messages, typingUser]);

  const startFakeProgress = () => {
    setUploadProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => setUploadProgress(prev => Math.min(prev + Math.random() * 15, 90)), 300);
  };
  const stopFakeProgress = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setUploadProgress(100);
    setTimeout(() => setUploadProgress(0), 500);
  };

  // Realtime subscriptions
  useEffect(() => {
    if (!threadId) return;
    const channel = supabase
      .channel(`thread-${threadId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
        (payload) => {
          queryClient.setQueryData(['thread', threadId], (old: any) => {
            if (!old) return old;
            return { ...old, messages: [...old.messages, payload.new] };
          });
          scrollToBottom();
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
        (payload) => {
          queryClient.setQueryData(['thread', threadId], (old: any) => {
            if (!old) return old;
            return {
              ...old,
              messages: old.messages.map((m: Message) => m.id === payload.new.id ? { ...m, ...payload.new } : m),
            };
          });
        })
      .subscribe();

    const typingChannel = supabase.channel(`typing-${threadId}`, { config: { broadcast: { self: true } } });
    typingChannel.on('broadcast', { event: 'typing' }, (payload) => {
      if (payload.payload.userId !== user?.id) {
        setTypingUser(payload.payload.userId);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
      }
    }).subscribe();

    return () => {
      supabase.removeChannel(channel).catch(console.warn);
      supabase.removeChannel(typingChannel).catch(console.warn);
    };
  }, [threadId, user?.id]);

  // Typing broadcast
  useEffect(() => {
    if (!threadId || !newMessage.trim()) return;
    const channel = supabase.channel(`typing-${threadId}`);
    channel.send({ type: 'broadcast', event: 'typing', payload: { userId: user?.id } });
  }, [newMessage, threadId, user?.id]);

  const uploadAttachment = async () => {
    if (!attachment || !threadId || !user) return null;
    setUploading(true);
    startFakeProgress();
    const fileName = `${user.id}/${threadId}/${Date.now()}-${attachment.name}`;
    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, attachment);
    stopFakeProgress();
    setUploading(false);
    if (error) {
      toast.error('Upload failed');
      return null;
    }
    const { data: publicUrl } = supabase.storage.from('chat-attachments').getPublicUrl(fileName);
    return publicUrl.publicUrl;
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment) || !user || !data?.thread) return;

    const thread = data.thread as any;
    const content = newMessage.trim() || (attachment ? attachment.name : '');
    let attachmentUrl: string | null = null;
    let attachmentType: string | null = null;

    if (attachment) {
      const url = await uploadAttachment();
      if (url) {
        attachmentUrl = url;
        attachmentType = attachment.type.startsWith('image/') ? 'image' : 'file';
      }
    }

    const recipient = thread.provider_id === user.id ? thread.customer_id : thread.provider_id;
    setNewMessage('');
    setAttachment(null);
    setSending(true);

    try {
      await db.from('messages').insert({
        thread_id: thread.id,
        sender_id: user.id,
        recipient_id: recipient,
        content: content || null,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
      } as any);
      await db.from('threads').update({ last_message: content, last_message_at: new Date().toISOString() } as any).eq('id', thread.id);
      queryClient.invalidateQueries({ queryKey: ['provider-threads', thread.provider_id] });
      queryClient.invalidateQueries({ queryKey: ['customer-threads', thread.customer_id] });
      await refetch();
      scrollToBottom();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (msgId: string) => {
    await db.from('messages').update({ deleted_at: new Date().toISOString() } as any).eq('id', msgId);
    setContextMenu(null);
  };

  const editMessage = async (msg: Message) => {
    if (!msg.content) return;
    const newContent = prompt('Edit message:', msg.content);
    if (newContent !== null && newContent !== msg.content) {
      await db.from('messages').update({ content: newContent, edited_at: new Date().toISOString() } as any).eq('id', msg.id);
    }
    setContextMenu(null);
  };

  const reportMessage = () => {
    toast.error('Report sent');
    setContextMenu(null);
  };

  const openContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({ message: msg, x: rect.left - 80, y: rect.bottom });
  };

  const handleTouchStart = (e: React.TouchEvent, msg: Message) => {
    const timer = setTimeout(() => {
      const touch = e.touches[0];
      setContextMenu({ message: msg, x: touch.clientX, y: touch.clientY });
    }, 500);
    e.currentTarget.addEventListener('touchend', () => clearTimeout(timer), { once: true });
    e.currentTarget.addEventListener('touchmove', () => clearTimeout(timer), { once: true });
  };

  // Safely extract other participant details
  const thread = (data as any)?.thread;
  const otherRole = (data as any)?.otherParticipant?.role;
  const otherId = thread?.provider_id === user?.id
    ? thread?.customer_id
    : thread?.provider_id;

  const bookAction = () => {
    if (otherRole === 'provider' && otherId) window.open(`/provider/${otherId}?book=true`, '_blank');
    setHeaderMenuOpen(false);
  };
  const reportAction = () => {
    if (otherId) router.push(`/report?target=${otherId}`);
    setHeaderMenuOpen(false);
  };
  const rateAction = () => {
    if (otherRole === 'provider' && otherId) window.open(`/provider/${otherId}?review=true`, '_blank');
    setHeaderMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-10 w-10 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data || !(data as any).thread) {
    return (
      <div className="text-center py-8 text-gray-500">
        Conversation not found.
      </div>
    );
  }

  const { otherParticipant, messages } = data as any;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 h-[calc(100vh-64px)] flex flex-col">
      {/* Header (white banner) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </button>
            {otherParticipant?.avatar_url ? (
              <img src={otherParticipant.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-medium">{otherParticipant?.full_name?.[0] || '?'}</span>
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold">{otherParticipant?.full_name || 'Chat'}</h1>
              {typingUser && <p className="text-xs text-gray-500">typing...</p>}
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setHeaderMenuOpen(!headerMenuOpen)} className="p-2 hover:bg-gray-100 rounded-full">
              <MoreVertical className="h-5 w-5 text-gray-500" />
            </button>
            {headerMenuOpen && (
              <div className="absolute right-0 mt-1 bg-white rounded-xl shadow-lg border py-2 w-48 z-20">
                {otherRole === 'provider' && (
                  <button onClick={bookAction} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Book
                  </button>
                )}
                <button onClick={reportAction} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Flag className="h-4 w-4" /> Report
                </button>
                {otherRole === 'provider' && (
                  <button onClick={rateAction} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Star className="h-4 w-4" /> Rate
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-gray-50 rounded-xl p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">No messages yet. Say hello!</p>
        ) : (
          messages.map((msg: Message) => (
            <div
              key={msg.id}
              className={cn('flex group items-start', msg.sender_id === user?.id ? 'justify-end' : 'justify-start')}
              onTouchStart={(e) => handleTouchStart(e, msg)}
            >
              <button
                className="hidden md:inline-flex opacity-0 group-hover:opacity-100 transition p-0.5 hover:bg-gray-200 rounded-full self-center"
                onClick={(e) => openContextMenu(e, msg)}
              >
                <MoreVertical className="h-4 w-4 text-gray-500" />
              </button>

              <div className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2 shadow-sm relative',
                msg.sender_id === user?.id ? 'bg-primary-600 text-white rounded-br-md' : 'bg-white border border-gray-200 rounded-bl-md',
                msg.deleted_at && 'opacity-50'
              )}>
                {msg.deleted_at ? (
                  <p className="text-sm italic text-gray-400">This message was deleted</p>
                ) : (
                  <>
                    {msg.attachment_url && (
                      <div className="mb-1 cursor-pointer" onClick={() => { if (msg.attachment_type === 'image') setSelectedImage(msg.attachment_url!); }}>
                        {msg.attachment_type === 'image' ? (
                          <img src={msg.attachment_url} alt="attachment" className="w-full max-w-[200px] rounded-lg" />
                        ) : (
                          <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs underline text-blue-600">
                            <File className="h-4 w-4" /> {msg.content || 'File'}
                          </a>
                        )}
                      </div>
                    )}
                    {msg.content && <p className="text-sm leading-relaxed break-words">{msg.content}</p>}
                    <div className={cn('text-[10px] mt-1 flex items-center justify-end gap-1', msg.sender_id === user?.id ? 'text-primary-100' : 'text-gray-400')}>
                      {msg.edited_at && <span className="italic">(edited) </span>}
                      {formatMessageTime(msg.created_at)}
                      {msg.sender_id === user?.id && (
                        msg.is_read ? <CheckCheck className="h-3 w-3 text-blue-300" /> : <Check className="h-3 w-3" />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
        {typingUser && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-2 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment preview */}
      {attachment && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-t-xl mt-2">
          <Image className="h-5 w-5 text-gray-500" />
          <span className="text-xs text-gray-700 truncate flex-1">{attachment.name}</span>
          {uploading && (
            <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          <button onClick={() => setAttachment(null)} className="text-gray-400 hover:text-red-500">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Permanent respectful‑use notice */}
      <div className="px-4 py-1 text-[10px] text-gray-400 text-center">
        Be respectful. No abusive language.
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="mt-1 flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
          onChange={(e) => setAttachment(e.target.files?.[0] || null)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-primary-600 rounded-full hover:bg-gray-100 transition"
          title="Attach"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 bg-gray-100 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={sending || uploading}
        />
        <button
          type="submit"
          disabled={sending || uploading || (!newMessage.trim() && !attachment)}
          className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 transition"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>

      {/* Context menu */}
      {contextMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)} onContextMenu={(e) => e.preventDefault()}>
          <div className="absolute bg-white rounded-xl shadow-lg border py-2 min-w-[120px]" style={{ left: contextMenu.x, top: contextMenu.y }}>
            {contextMenu.message.sender_id === user?.id && !contextMenu.message.deleted_at && (
              <>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50" onClick={() => editMessage(contextMenu.message)}>Edit</button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-500" onClick={() => deleteMessage(contextMenu.message.id)}>Delete</button>
              </>
            )}
            {contextMenu.message.sender_id !== user?.id && (
              <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-500" onClick={reportMessage}>Report</button>
            )}
          </div>
        </div>
      )}

      {/* Full‑screen image viewer */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="full" className="max-w-full max-h-full object-contain" />
          <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/40">
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
};