// src/components/common/Header.tsx
'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  ChevronDown,
  LayoutDashboard,
  Settings,
  LogOut,
  ArrowLeft,
  Shield,
  Calendar,
  Image,
  Package,
  Phone,
  Globe,
  Lock,
  Trash2,
  MessageCircle,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import toast from 'react-hot-toast';

// Solid icons
const SolidBookingIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zM7 11h4v4H7v-4z"/>
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

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [counts, setCounts] = useState({ bookings: 0, messages: 0, system: 0 });
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'main' | 'settings'>('main');
  const [signingOut, setSigningOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auth listener + initial session fetch
  useEffect(() => {
    // Initial session check
    const fetchSession = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('role, is_verified, avatar_url, full_name')
          .eq('id', currentUser.id)
          .single();
        setProfile(prof);

        const [
          { count: bookingCount },
          { count: msgCount },
          { count: notifCount },
        ] = await Promise.all([
          supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('threads').select('id', { count: 'exact', head: true })
            .or(`provider_id.eq.${currentUser.id},customer_id.eq.${currentUser.id}`),
          supabase.from('notifications').select('id', { count: 'exact', head: true })
            .eq('user_id', currentUser.id).eq('is_read', false),
        ]);
        setCounts({ bookings: bookingCount || 0, messages: msgCount || 0, system: notifCount || 0 });
      } else {
        setProfile(null);
        setCounts({ bookings: 0, messages: 0, system: 0 });
      }
    };
    fetchSession();

    // Real-time auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        supabase
          .from('profiles')
          .select('role, is_verified, avatar_url, full_name')
          .eq('id', currentUser.id)
          .single()
          .then(({ data: prof }) => setProfile(prof));

        Promise.all([
          supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('threads').select('id', { count: 'exact', head: true })
            .or(`provider_id.eq.${currentUser.id},customer_id.eq.${currentUser.id}`),
          supabase.from('notifications').select('id', { count: 'exact', head: true })
            .eq('user_id', currentUser.id).eq('is_read', false),
        ]).then(([b, m, n]) => {
          setCounts({
            bookings: b.count || 0,
            messages: m.count || 0,
            system: n.count || 0,
          });
        });
      } else {
        setProfile(null);
        setCounts({ bookings: 0, messages: 0, system: 0 });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const role = profile?.role || 'customer';

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      // State cleared by the onAuthStateChange listener above, no need to manually set here
      toast.success('Signed out');
      router.push('/');
    } catch (error) {
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setSigningOut(false);
      setIsUserMenuOpen(false);
      setMobileProfileOpen(false);
      setMobileView('main');
    }
  };

  const getDashboardLink = () => (role === 'provider' ? '/provider/dashboard' : '/customer/dashboard');
  const getBookingsLink = () => (role === 'provider' ? '/provider/bookings' : '/customer/bookings');
  const getMessagesLink = () => (role === 'provider' ? '/provider/messages' : '/customer/messages');
  // ✅ FIXED: Notifications now point to global /notifications
  const getNotificationsLink = () => '/notifications';
  const getProfileLink = () => (role === 'provider' ? '/provider/profile' : '/customer/profile');
  const getPortfolioLink = () => (role === 'provider' ? '/provider/portfolio' : null);
  const getServicesLink = () => (role === 'provider' ? '/provider/services' : null);
  const getVerificationLink = () => (role === 'provider' ? '/provider/verification' : null);

  const markBookingsAsSeen = async () => {};
  const markMessagesAsSeen = async () => {};
  const markSystemAsSeen = async () => {};

  const isOnMessagesPage = pathname.includes('/messages');
  const showMessagesBadge = !isOnMessagesPage && counts.messages > 0;

  const handleBookingsClick = async () => {
    if (!user) { router.push('/auth/signin'); return; }
    await markBookingsAsSeen();
    router.push(getBookingsLink());
  };

  const handleMessagesClick = async () => {
    if (!user) { router.push('/auth/signin'); return; }
    await markMessagesAsSeen();
    router.push(getMessagesLink());
  };

  const handleNotificationsClick = async () => {
    if (!user) { router.push('/auth/signin'); return; }
    await markSystemAsSeen();
    router.push(getNotificationsLink());
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    if (user) setIsUserMenuOpen(true);
  };

  const handleMouseLeave = () => {
    if (!user) return;
    closeTimeoutRef.current = setTimeout(() => setIsUserMenuOpen(false), 150);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const mobileMainItems = [
    { label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, to: getDashboardLink(), disabled: false },
    { label: 'Messages', icon: <MessageCircle className="h-5 w-5" />, to: getMessagesLink(), disabled: false },
    { label: 'My Bookings', icon: <Calendar className="h-5 w-5" />, to: getBookingsLink(), disabled: false },
    ...(role === 'provider' ? [
      { label: 'Portfolio', icon: <Image className="h-5 w-5" />, to: getPortfolioLink()!, disabled: false },
      { label: 'Set Prices', icon: <Package className="h-5 w-5" />, to: getServicesLink()!, disabled: false },
      { label: 'Get Verified', icon: <Shield className="h-5 w-5" />, to: getVerificationLink()!, disabled: profile?.is_verified === true },
    ] : []),
    { label: 'Settings', icon: <Settings className="h-5 w-5" />, action: () => setMobileView('settings'), disabled: false },
  ];

  const mobileSettingsItems = [
    { label: 'Profile Setup', icon: <Settings className="h-5 w-5" />, to: getProfileLink() },
    { label: 'Change Phone/Email', icon: <Phone className="h-5 w-5" />, to: getProfileLink() },
    { label: 'Change Language', icon: <Globe className="h-5 w-5" />, action: () => toast.success('Language selector coming soon') },
    { label: 'Change Password', icon: <Lock className="h-5 w-5" />, to: '/auth/reset-password' },
    { label: 'Delete My Account', icon: <Trash2 className="h-5 w-5 text-red-500" />, action: () => {
      if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        toast.error('Account deletion is not yet implemented.');
      }
    }, danger: true },
  ];

  const handleMobileProfileClick = () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    setMobileView('main');
    setMobileProfileOpen(true);
  };

  const closeMobileProfile = () => {
    setMobileProfileOpen(false);
    setMobileView('main');
  };

  return (
    <>
      <header
        className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-200/50"
        style={{
          transform: 'translateZ(0)',
          willChange: 'transform',
          WebkitPosition: 'sticky',
          position: 'sticky',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center flex-shrink-0">
              <img src="/logo.png" alt="Nimart" className="h-8 sm:h-10 w-auto" />
            </Link>

            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Bookings icon */}
              <button onClick={handleBookingsClick} title="Bookings" aria-label="Bookings" className="relative hidden md:block">
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-100" />
                <span className="relative flex items-center justify-center w-9 h-9">
                  <SolidBookingIcon className="w-5 h-5 text-[#008751] transition-colors" />
                  {counts.bookings > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full">
                      {counts.bookings > 9 ? '9+' : counts.bookings}
                    </span>
                  )}
                </span>
              </button>

              {/* Messages icon */}
              <button onClick={handleMessagesClick} title="Messages" aria-label="Messages" className="relative hidden md:block">
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-100" />
                <span className="relative flex items-center justify-center w-9 h-9">
                  <SolidMessageIcon className="w-5 h-5 text-[#008751] transition-colors" />
                  {showMessagesBadge && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full">
                      {counts.messages > 9 ? '9+' : counts.messages}
                    </span>
                  )}
                </span>
              </button>

              {/* Notifications icon – now goes to /notifications */}
              <button onClick={handleNotificationsClick} title="Notifications" aria-label="Notifications" className="relative hidden md:block">
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-100" />
                <span className="relative flex items-center justify-center w-9 h-9">
                  <SolidBellIcon className="w-5 h-5 text-[#008751] transition-colors" />
                  {counts.system > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full">
                      {counts.system > 9 ? '9+' : counts.system}
                    </span>
                  )}
                </span>
              </button>

              {/* Auth buttons */}
              {!user ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => router.push('/auth/signin')}
                    className="flex items-center gap-1 px-1.5 py-1.5 rounded-full border border-[#008751] text-[#008751] hover:bg-green-50 transition text-xs sm:text-sm font-medium"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => router.push('/auth/signup')}
                    className="flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-[#008751] text-white hover:bg-green-700 transition text-xs sm:text-sm font-medium"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Register</span>
                  </button>
                </div>
              ) : (
                <div
                  className="relative"
                  ref={userMenuRef}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    title="Account"
                    aria-label="Account"
                    onClick={handleMobileProfileClick}
                    className="flex items-center space-x-1 p-1"
                  >
                    <span className="relative flex items-center justify-center w-9 h-9">
                      <span className="absolute inset-0 rounded-full bg-[#008751]" />
                      {profile?.avatar_url ? (
                        <OptimizedImage
                          src={profile.avatar_url}
                          alt={profile.full_name || 'User'}
                          className="relative w-8 h-8 rounded-full object-cover ring-2 ring-white"
                        />
                      ) : (
                        <svg className="relative w-5 h-5 text-white" aria-hidden="true">
                          <use href="/icons/sprite.svg#avatar" />
                        </svg>
                      )}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500 hidden md:block" />
                  </button>

                  {/* Desktop dropdown */}
                  {isUserMenuOpen && (
                    <div
                      className="absolute right-0 pt-2 z-10 hidden md:block"
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="bg-white rounded-md shadow-lg py-1 border border-gray-200 min-w-[180px]">
                        <Link href={getDashboardLink()} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsUserMenuOpen(false)}>
                          <LayoutDashboard className="h-4 w-4 text-gray-500" /> Dashboard
                        </Link>
                        <Link href={getProfileLink()} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsUserMenuOpen(false)}>
                          <Settings className="h-4 w-4 text-gray-500" /> Profile Settings
                        </Link>
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={handleSignOut}
                          disabled={signingOut}
                          className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <LogOut className="h-4 w-4" />
                          {signingOut ? 'Signing out…' : 'Sign Out'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile full‑screen profile panel */}
      {user && mobileProfileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-white">
          <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-200">
            <button
              onClick={() => {
                if (mobileView === 'settings') setMobileView('main');
                else closeMobileProfile();
              }}
              className="p-1 hover:bg-gray-100 rounded-full"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="font-semibold text-lg text-gray-900">
              {mobileView === 'settings' ? 'Settings' : 'Profile'}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {mobileView === 'main' ? (
              <div className="grid grid-cols-2 gap-4">
                {mobileMainItems.map((item) =>
                  item.action ? (
                    <button
                      key={item.label}
                      onClick={item.action}
                      disabled={item.disabled}
                      className={cn(
                        'flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 bg-gray-50 transition',
                        item.disabled ? 'opacity-40 pointer-events-none' : 'hover:bg-primary-50 hover:border-primary-200'
                      )}
                      aria-label={item.label}
                    >
                      <div className={cn('mb-2', item.disabled ? 'text-gray-400' : 'text-primary-600')}>{item.icon}</div>
                      <span className={cn('text-xs font-medium text-center', item.disabled ? 'text-gray-400' : 'text-gray-700')}>{item.label}</span>
                    </button>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.to || '#'}
                      onClick={closeMobileProfile}
                      className={cn(
                        'flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 bg-gray-50 transition',
                        item.disabled ? 'opacity-40 pointer-events-none' : 'hover:bg-primary-50 hover:border-primary-200'
                      )}
                    >
                      <div className={cn('mb-2', item.disabled ? 'text-gray-400' : 'text-primary-600')}>{item.icon}</div>
                      <span className={cn('text-xs font-medium text-center', item.disabled ? 'text-gray-400' : 'text-gray-700')}>{item.label}</span>
                    </Link>
                  )
                )}
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-red-50 hover:border-red-200 transition group disabled:opacity-50"
                  aria-label="Sign Out"
                >
                  <LogOut className="h-5 w-5 text-red-500 group-hover:text-red-600 mb-2" />
                  <span className="text-xs font-medium text-red-500 group-hover:text-red-600">
                    {signingOut ? 'Signing out…' : 'Sign Out'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {mobileSettingsItems.map((item) =>
                  item.action ? (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className={cn(
                        'flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 bg-gray-50 transition hover:bg-primary-50 hover:border-primary-200',
                        item.danger && 'hover:bg-red-50 hover:border-red-200'
                      )}
                      aria-label={item.label}
                    >
                      <div className={cn('mb-2', item.danger ? 'text-red-500' : 'text-primary-600')}>{item.icon}</div>
                      <span className={cn('text-xs font-medium text-center', item.danger ? 'text-red-500' : 'text-gray-700')}>{item.label}</span>
                    </button>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.to || '#'}
                      onClick={closeMobileProfile}
                      className={cn(
                        'flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 bg-gray-50 transition hover:bg-primary-50 hover:border-primary-200',
                        item.danger && 'hover:bg-red-50 hover:border-red-200'
                      )}
                    >
                      <div className={cn('mb-2', item.danger ? 'text-red-500' : 'text-primary-600')}>{item.icon}</div>
                      <span className={cn('text-xs font-medium text-center', item.danger ? 'text-red-500' : 'text-gray-700')}>{item.label}</span>
                    </Link>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}