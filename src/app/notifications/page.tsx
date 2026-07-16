'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCircle, Calendar, MessageCircle, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import { SEO } from '@/components/common/SEO';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: any;
  is_read: boolean;
  created_at: string;
}

const iconMap: Record<string, React.ElementType> = {
  booking: Calendar,
  message: MessageCircle,
  system: Bell,
  alert: AlertCircle,
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel('notifications-page')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          toast.success((payload.new as Notification).title, { icon: '🔔' });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev =>
            prev.map(n => n.id === payload.new.id ? { ...n, ...payload.new } : n)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(console.warn);
    };
  }, [user]);

  async function fetchNotifications() {
    if (!user) return;
    setLoading(true);
    const { data } = await db
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setNotifications((data as Notification[]) || []);
    setLoading(false);
  }

  async function markAsRead(id: string) {
    await db
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);
  }

  async function markAllAsRead() {
    if (!user) return;
    await db
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('All notifications marked as read');
  }

  async function deleteNotification(id: string) {
    await db.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
    }

    const data = notification.data;
    if (data?.booking_id) {
      const role = data.role || 'customer';
      router.push(`/${role}/bookings`);
    } else if (data?.thread_id) {
      const role = data.role || 'customer';
      router.push(`/${role}/messages/${data.thread_id}`);
    } else if (data?.provider_id) {
      router.push(`/provider/${data.provider_id}`);
    }
  };

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => !n.is_read);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user && !loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">Please sign in to view notifications.</p>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Notifications | Nimart"
        description="View your notifications on Nimart."
        url="https://nimart.ng/notifications"
      />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-sm text-primary-600 hover:underline">
                Mark all as read
              </button>
            )}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
              className="px-3 py-1 border rounded-lg text-sm"
            >
              <option value="all">All</option>
              <option value="unread">Unread ({unreadCount})</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><NimartSpinner size="md" /></div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notif) => {
              const Icon = iconMap[notif.type] || Bell;
              const hasAction = notif.data?.booking_id || notif.data?.thread_id || notif.data?.provider_id;

              return (
                <div
                  key={notif.id}
                  className={cn(
                    'bg-white rounded-lg shadow-sm border p-4 transition',
                    !notif.is_read && 'border-l-4 border-l-primary-500 bg-primary-50/30',
                    hasAction && 'cursor-pointer hover:shadow-md hover:bg-gray-50'
                  )}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-full', !notif.is_read ? 'bg-primary-100' : 'bg-gray-100')}>
                      <Icon className={cn('h-5 w-5', !notif.is_read ? 'text-primary-600' : 'text-gray-500')} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={cn('font-medium', !notif.is_read && 'text-gray-900')}>{notif.title}</h3>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {notif.body && <p className="text-sm text-gray-600 mt-1">{notif.body}</p>}
                      {hasAction && (
                        <p className="text-xs text-primary-600 font-medium mt-2 hover:underline">
                          Tap to view details →
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}