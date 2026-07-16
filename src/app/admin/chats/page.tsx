// src/app/admin/chats/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, Send, ChevronRight, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { NimartSpinner } from '@/components/common/NimartSpinner';

interface Chat {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  user: {
    full_name: string;
    email: string;
  };
  last_message?: string;
  last_message_at?: string;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_type: 'user' | 'admin';
  content: string;
  created_at: string;
}

export default function AdminChats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChats();

    const channel = supabase
      .channel('admin-chats')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_chats' },
        () => fetchChats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  async function fetchChats() {
    const { data } = await db
      .from('support_chats')
      .select(`
        *,
        user:user_id(full_name),
        auth_user:auth.users!inner(email)
      `)
      .order('updated_at', { ascending: false });

    if (data) {
      const formattedChats = data.map((chat: any) => ({
        ...chat,
        user: {
          full_name: chat.user?.full_name || 'Unknown',
          email: chat.auth_user?.email || '',
        },
      }));
      setChats(formattedChats);
    }
    setLoading(false);
  }

  async function fetchMessages(chatId: string) {
    const { data } = await db
      .from('support_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
    scrollToBottom();

    await db
      .from('support_messages')
      .update({ is_read: true })
      .eq('chat_id', chatId)
      .eq('sender_type', 'user')
      .eq('is_read', false);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !user) return;

    setSending(true);
    const { error } = await db.from('support_messages').insert({
      chat_id: selectedChat.id,
      sender_id: user.id,
      sender_type: 'admin',
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage('');
      await db
        .from('support_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedChat.id);
    } else {
      toast.error('Failed to send message');
    }
    setSending(false);
  }

  async function updateChatStatus(chatId: string, status: string) {
    await db
      .from('support_chats')
      .update({ status })
      .eq('id', chatId);
    fetchChats();
    if (selectedChat?.id === chatId) {
      setSelectedChat({ ...selectedChat, status });
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  const statusColors: Record<string, string> = {
    open: 'bg-green-100 text-green-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Support Chats</h1>

      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Chat List */}
        <div className={cn(
          'bg-white rounded-lg shadow-sm border overflow-hidden',
          selectedChat ? 'hidden md:block md:w-80' : 'w-full md:w-80'
        )}>
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Conversations</h2>
          </div>
          <div className="overflow-y-auto h-full">
            {loading ? (
              <div className="flex justify-center p-4">
                <NimartSpinner size="md" />
              </div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No chats yet</div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={cn(
                    'w-full text-left p-4 border-b hover:bg-gray-50 transition',
                    selectedChat?.id === chat.id && 'bg-primary-50'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{chat.user.full_name}</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[chat.status])}>
                      {chat.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{chat.subject}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(chat.created_at), 'MMM d, h:mm a')}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        {selectedChat ? (
          <div className="flex-1 bg-white rounded-lg shadow-sm border flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-1 hover:bg-gray-100 rounded"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <p className="font-medium text-gray-900">{selectedChat.user.full_name}</p>
                  <p className="text-sm text-gray-500">{selectedChat.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedChat.status}
                  onChange={(e) => updateChatStatus(selectedChat.id, e.target.value)}
                  className="text-sm border rounded-lg px-2 py-1"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500">No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn('flex', msg.sender_type === 'admin' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[70%] rounded-lg px-4 py-2',
                        msg.sender_type === 'admin'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      )}
                    >
                      <p>{msg.content}</p>
                      <p className={cn(
                        'text-xs mt-1',
                        msg.sender_type === 'admin' ? 'text-primary-100' : 'text-gray-500'
                      )}>
                        {format(new Date(msg.created_at), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your reply..."
                className="flex-1 px-4 py-2 border rounded-lg"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 bg-white rounded-lg shadow-sm border items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}