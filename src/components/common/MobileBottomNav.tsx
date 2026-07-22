// src/components/common/MobileBottomNav.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';
import { CalendarDays } from 'lucide-react';

// Solid SVG icons (message, bell, home, map)
const SolidHomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);

const SolidMessageIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
  </svg>
);

const SolidBellIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm7-5h-1v-4c0-3.3-2.7-6-6-6s-6 2.7-6 6v4H5v2h14v-2z"/>
  </svg>
);

const SolidMapIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
  </svg>
);

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export function MobileBottomNav() {
  const { profile } = useAuth();
  const { counts, markBookingsAsSeen, markMessagesAsSeen, markSystemAsSeen } = useNotifications();
  const router = useRouter();
  const pathname = usePathname();

  const isHomePage = pathname === '/' || pathname === '/search';

  const [visible, setVisible] = useState(true);
  const [tierPanelOpen, setTierPanelOpen] = useState(false);
  const footerObserverRef = useRef<IntersectionObserver | null>(null);

  // Listen for tier panel open/close
  useEffect(() => {
    const handlePanelOpen = () => setTierPanelOpen(true);
    const handlePanelClose = () => setTierPanelOpen(false);
    window.addEventListener('tierPanelOpened', handlePanelOpen);
    window.addEventListener('tierPanelClosed', handlePanelClose);
    return () => {
      window.removeEventListener('tierPanelOpened', handlePanelOpen);
      window.removeEventListener('tierPanelClosed', handlePanelClose);
    };
  }, []);

  // Only hide when the large footer is visible AND we are on the homepage
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer || !isHomePage) {
      setVisible(true);
      return;
    }
    footerObserverRef.current = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px' }
    );
    footerObserverRef.current.observe(footer);
    return () => footerObserverRef.current?.disconnect();
  }, [isHomePage]);

  const getLink = (roleSuffix: string) => {
    if (!profile) return '/auth/signin';
    return profile.role === 'provider' ? `/provider/${roleSuffix}` : `/customer/${roleSuffix}`;
  };

  // Compute badge visibility (same logic as Header)
  const isOnMessagesPage = pathname.includes('/messages');
  const showMessagesBadge = !isOnMessagesPage && counts.messages > 0;
  const showBookingsBadge = counts.bookings > 0;
  const showSystemBadge = counts.system > 0;

  // Navigate and mark as seen — instant response, no setTimeout
  const navigate = (path: string, markAsSeen?: () => Promise<void>) => {
    router.replace(path);
    if (markAsSeen) markAsSeen().catch(console.error);
  };

  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <SolidHomeIcon className="w-6 h-6" />,
      onClick: () => navigate('/'),
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <CalendarDays className="w-6 h-6" />,
      onClick: () => navigate(getLink('bookings'), markBookingsAsSeen),
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <SolidMessageIcon className="w-6 h-6" />,
      onClick: () => navigate(getLink('messages'), markMessagesAsSeen),
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <SolidBellIcon className="w-6 h-6" />,
      onClick: () => navigate('/notifications', markSystemAsSeen),
    },
    {
      id: 'map',
      label: 'Map',
      icon: <SolidMapIcon className="w-6 h-6" />,
      onClick: () => navigate('/map'),
    },
  ];

  if (tierPanelOpen) return null;

  return (
    <div
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 z-50',
        'bg-white/90 backdrop-blur-md border-t border-gray-200/50',
        'transition-all duration-300 ease-out',
        'pb-[env(safe-area-inset-bottom)] pt-1',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      )}
    >
      <div className="flex justify-around items-center min-h-[56px]">
        {navItems.map((item) => {
          let active = false;
          if (item.id === 'home') {
            active = pathname === '/' || pathname === '/search';
          } else if (item.id === 'map') {
            active = pathname.startsWith('/map');
          } else if (item.id === 'alerts') {
            active = pathname.startsWith('/notifications');
          } else {
            const basePath = profile?.role === 'provider' ? `/provider/${item.id}` : `/customer/${item.id}`;
            active = pathname.startsWith(basePath);
          }

          const badge = item.id === 'bookings' && showBookingsBadge ? counts.bookings
                     : item.id === 'messages' && showMessagesBadge ? counts.messages
                     : item.id === 'alerts' && showSystemBadge ? counts.system
                     : null;

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              aria-label={item.label}
              className={cn(
                'relative flex flex-col items-center justify-center flex-1 py-1',
                'transition-colors duration-200 active:scale-90',
                active
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-primary-600'
              )}
            >
              <div className="relative">
                {active && (
                  <span className="absolute inset-0 w-10 h-8 -top-1 -left-2 bg-primary-100 rounded-full -z-10" />
                )}
                {item.icon}
                {badge !== null && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}