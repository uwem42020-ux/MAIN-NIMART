// src/app/provider/[id]/ProviderProfileClient.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-any';
import { useAuth } from '@/contexts/AuthContext';
import { calculateDistance } from '@/lib/distance';
import { ProviderCardPortrait } from '@/components/provider/ProviderCardPortrait';
import { ProviderCardHorizontal } from '@/components/provider/ProviderCardHorizontal';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { FavoriteButton } from '@/components/common/FavoriteButton';
import {
  MapPin,
  Star,
  Calendar,
  ArrowLeft,
  X,
  MessageCircle,
  Flag,
  Phone,
  Clock,
  Package,
  ArrowRight,
  Share2,
  GraduationCap,
  Languages,
  User,
  LayoutGrid,
  List,
  Maximize2,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { useSmartSort } from '@/hooks/useSmartSort';
import dynamic from 'next/dynamic';

const BookingFormModal = dynamic(
  () => import('@/components/customer/BookingFormModal').then(mod => ({ default: mod.BookingFormModal })),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl p-6 text-sm text-gray-600">Loading booking form…</div>
      </div>
    ),
  }
);

const ReviewsList = dynamic(
  () => import('@/components/reviews/ReviewsList').then(mod => ({ default: mod.ReviewsList })),
  {
    ssr: false,
    loading: () => (
      <div className="py-8 text-center text-sm text-gray-400">Loading reviews…</div>
    ),
  }
);

type ProviderRow = Database['public']['Tables']['providers']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type PortfolioImageRow = Database['public']['Tables']['portfolio_images']['Row'];
type ReviewRow = Database['public']['Tables']['reviews']['Row'] & {
  reviewer: { full_name: string | null; avatar_url: string | null } | null;
};
type ServiceRow = Database['public']['Tables']['provider_services']['Row'];

interface FullProvider extends ProviderRow {
  profile: ProfileRow | null;
  portfolio_images: PortfolioImageRow[];
  reviews: ReviewRow[];
  services: ServiceRow[];
  distance?: number;
  completedBookings?: number;
  lastSignInAt?: string | null;
}

const statusIconMap: Record<string, string> = {
  available: '/active.svg',
  busy: '/busy.svg',
  away: '/away.svg',
};

const statusLabel: Record<string, string> = {
  available: 'Available for Booking',
  busy: 'Busy',
  away: 'Away',
};

const priceTypeLabels: Record<string, string> = {
  fixed: 'Fixed Price',
  hourly: 'Per Hour',
  daily: 'Per Day',
  negotiable: 'Negotiable',
};

export function ProviderProfileClient({
  initialProvider,
}: {
  initialProvider: FullProvider;
}) {
  const id = initialProvider.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const [similarViewMode, setSimilarViewMode] = useState<'grid' | 'list'>('grid');
  const queryClient = useQueryClient();

  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const { data: provider, isLoading, refetch } = useQuery({
    queryKey: ['provider', id],
    queryFn: async () => {
      const [
        providerRes,
        profileRes,
        portfolioRes,
        reviewsRes,
        servicesRes,
        completedRes,
        lastSignInRes,
      ] = await Promise.all([
        db.from('providers').select('*').eq('id', id).single(),
        db.from('profiles').select('*').eq('id', id).single(),
        db.from('portfolio_images').select('*').eq('provider_id', id).order('created_at', { ascending: false }),
        db.from('reviews').select(`id, rating, content, created_at, reviewer:reviewer_id(full_name, avatar_url)`).eq('provider_id', id).order('created_at', { ascending: false }),
        db.from('provider_services').select('*').eq('provider_id', id).order('created_at', { ascending: true }),
        db.rpc('get_provider_completed_bookings', { provider_id: id }),
        db.rpc('get_user_last_sign_in', { user_id: id }),
      ]);

      return {
        ...(providerRes.data as any),
        profile: profileRes.data ?? null,
        portfolio_images: portfolioRes.data ?? [],
        reviews: (reviewsRes.data as ReviewRow[]) ?? [],
        services: servicesRes.data ?? [],
        completedBookings: completedRes.data ?? 0,
        lastSignInAt: lastSignInRes.data ?? null,
        created_at: (profileRes.data as any)?.created_at ?? null,
      } as FullProvider;
    },
    initialData: initialProvider,
    staleTime: 1000 * 60 * 5,
  });

  const { data: smartSortData } = useSmartSort(
    profile?.id,
    provider?.profile?.lat ?? undefined,
    provider?.profile?.lng ?? undefined,
    provider?.selected_tier_slug,
    provider?.selected_category_slug,
    20
  );

  const { data: similarProviders } = useQuery({
    queryKey: ['similar-providers', id, smartSortData],
    queryFn: async () => {
      if (!id || !provider) return [];

      const { data: currentProfile } = await db
        .from('profiles')
        .select('lat, lng')
        .eq('id', id)
        .single();

      const { data: allProviders } = await db
        .from('providers')
        .select('id, business_name, selected_category_slug, selected_tier_slug')
        .neq('id', id)
        .eq('is_available', true)
        .limit(30);

      if (!allProviders || allProviders.length === 0) return [];

      const providerIds = allProviders.map((p: any) => p.id);

      const { data: profiles } = await db
        .from('profiles')
        .select('id, lat, lng, avatar_url, full_name')
        .in('id', providerIds);

      const profileMap = new Map<string, any>();
      profiles?.forEach((prof: any) => profileMap.set(prof.id, prof));

      const userLat = (currentProfile as any)?.lat;
      const userLng = (currentProfile as any)?.lng;

      const enriched = allProviders
        .filter((p: any) => profileMap.has(p.id))
        .map((p: any) => {
          const prof = profileMap.get(p.id);
          const distance =
            userLat && userLng && prof?.lat && prof?.lng
              ? calculateDistance(userLat, userLng, prof.lat, prof.lng)
              : undefined;
          return {
            id: p.id,
            business_name: p.business_name || prof?.full_name,
            selected_category_slug: p.selected_category_slug,
            selected_tier_slug: p.selected_tier_slug,
            profile: {
              full_name: prof?.full_name,
              avatar_url: prof?.avatar_url,
              lat: prof?.lat,
              lng: prof?.lng,
            },
            distance,
            description: '',
            status: 'available',
            is_available: true,
            selected_subcategory_id: null,
            tags: [],
            boost_until: null,
            top_placement_until: null,
            portfolio_images: [],
            average_rating: 0,
            review_count: 0,
            lastSignInAt: null,
          };
        });

      if (smartSortData && smartSortData.length > 0) {
        const scoreMap = new Map(smartSortData.map(s => [s.provider_id, s.score]));
        enriched.sort((a: any, b: any) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0));
      } else {
        const currentCategory = provider.selected_category_slug;
        enriched.sort((a: any, b: any) => {
          if (a.selected_category_slug === currentCategory && b.selected_category_slug !== currentCategory) return -1;
          if (a.selected_category_slug !== currentCategory && b.selected_category_slug === currentCategory) return 1;
          return (a.distance ?? Infinity) - (b.distance ?? Infinity);
        });
      }

      return enriched.slice(0, 8);
    },
    enabled: !!id && !!provider,
  });

  const requireAuth = (callback: () => void) => {
    if (!user) {
      toast.error('Please sign in to continue');
      router.push('/auth/signin');
      return;
    }
    callback();
  };

  const openChat = () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    startConversation();
  };

  const startConversation = async () => {
    if (!user || !id) return;

    let { data: existingThread } = await db
      .from('threads')
      .select('id')
      .eq('provider_id', user.id)
      .eq('customer_id', id)
      .limit(1)
      .maybeSingle();

    if (!existingThread) {
      const { data: reverse } = await db
        .from('threads')
        .select('id')
        .eq('provider_id', id)
        .eq('customer_id', user.id)
        .limit(1)
        .maybeSingle();
      existingThread = reverse;
    }

    const basePath = profile?.role === 'provider' ? '/provider/messages' : '/customer/messages';

    if (existingThread) {
      setTimeout(() => router.push(`${basePath}/${existingThread.id}`), 0);
      return;
    }

    try {
      const { data: newThread, error } = await db
        .from('threads')
        .insert({
          provider_id: id,
          customer_id: user.id,
          created_by: user.id,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;

      setTimeout(() => router.push(`${basePath}/${newThread.id}`), 0);
    } catch (err) {
      console.error('Failed to create conversation:', err);
      toast.error('Could not start conversation. Please try again.');
    }
  };

  const shareProviderLink = () => {
    const url = `${window.location.origin}/provider/${id}`;
    if (navigator.share) {
      navigator.share({ title: providerName, url }).catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
  };

  const fallbackCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => toast.success('Link copied'))
        .catch(() => execCopy(text));
    } else {
      execCopy(text);
    }
  };

  const execCopy = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
    document.body.removeChild(textarea);
  };

  useEffect(() => {
    if (searchParams.get('book') === 'true' && user) {
      setShowBookingModal(true);
    }
  }, [searchParams, user]);

  useEffect(() => {
    if (searchParams.get('review') === 'true') {
      requireAuth(() => setShowReviewModal(true));
    }
  }, [searchParams, user]);

  const submitReview = async () => {
    if (!user) { toast.error('Please sign in to leave a review'); router.push('/auth/signin'); return; }
    const bookingId = searchParams.get('bookingId');
    setSubmittingReview(true);
    try {
      const { data: existingReview } = await db
        .from('reviews')
        .select('id')
        .eq('reviewer_id', user.id)
        .eq('provider_id', id!)
        .maybeSingle();
      if (existingReview) { toast.error('You have already reviewed this provider'); setShowReviewModal(false); return; }
      const { error } = await db.from('reviews').insert([{
        reviewer_id: user.id,
        provider_id: id!,
        booking_id: bookingId || null,
        rating: reviewRating,
        content: reviewContent || null,
      }]);
      if (error) throw error;
      toast.success('Review submitted! Thank you.');
      setShowReviewModal(false);
      refetch();
    } catch (error: any) { toast.error(error.message); }
    finally { setSubmittingReview(false); }
  };

  const submitReport = async () => {
    if (!user) { toast.error('Please sign in to report this provider'); router.push('/auth/signin'); return; }
    if (!reportReason.trim()) { toast.error('Please provide a reason for the report'); return; }
    setSubmittingReport(true);
    try {
      const { error } = await db.from('reports').insert({
        reporter_id: user.id,
        provider_id: id!,
        reason: reportReason.trim(),
      });
      if (error) throw error;
      toast.success('Thank you for your report. Our team will review it.');
      setShowReportModal(false);
      setReportReason('');
    } catch (error: any) { toast.error(error.message); }
    finally { setSubmittingReport(false); }
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || !provider?.portfolio_images?.length) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentImageIndex < provider.portfolio_images.length - 1) {
        setCurrentImageIndex(prev => prev + 1);
      } else if (diff < 0 && currentImageIndex > 0) {
        setCurrentImageIndex(prev => prev - 1);
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const avgRating = provider?.reviews?.length
    ? provider.reviews.reduce((acc, r) => acc + r.rating, 0) / provider.reviews.length
    : 0;

  const lastSeen = provider?.lastSignInAt
    ? formatDistanceToNow(new Date(provider.lastSignInAt), { addSuffix: true })
    : 'Recently';

  const locationString = provider?.profile?.lga_name
? `${provider.profile.lga_name}, ${(provider.profile as any)?.state_name || ''}`
    : 'Location not set';

  const joinedYear = provider?.created_at
    ? new Date(provider.created_at).getFullYear()
    : null;

  const categoryName = provider?.selected_category_slug
    ?.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Provider';

  const lgaName = provider?.profile?.lga_name || 'your area';
  const stateName = (provider?.profile as any)?.state_name || 'Nigeria';
  const providerName = provider?.business_name || provider?.profile?.full_name || 'Provider';

  const shortDescription = provider?.description
    ? provider.description.length > 150
      ? provider.description.substring(0, 150) + '...'
      : provider.description
    : '';

  const breadcrumbItems = [
    { label: 'Home', to: '/' },
    { label: categoryName, to: `/search?category=${provider?.selected_category_slug}` },
    { label: providerName },
  ];

  const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn('bg-white rounded-2xl shadow-sm border border-gray-100 p-6', className)}>
      {children}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-4 sm:px-6 lg:px-8 py-0 sm:py-8">
      {/* ========== MOBILE LAYOUT ========== */}
      <div className="block md:hidden">
        <div className="relative h-48 sm:h-52 bg-gray-100 overflow-hidden">
          {provider?.profile?.cover_photo ? (
            <button onClick={() => setCoverModalOpen(true)} className="w-full h-full relative group">
              <img
                src={provider.profile.cover_photo}
                alt="Cover"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary-100 to-green-100" />
          )}
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 z-10 bg-white/20 backdrop-blur-md text-white p-2 rounded-full border border-white/30 shadow-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex justify-center -mt-14 mb-4 px-4">
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
              {provider?.profile?.avatar_url ? (
                <button onClick={() => setAvatarModalOpen(true)} className="w-full h-full relative group">
                  <OptimizedImage
                    src={provider.profile.avatar_url}
                    alt={providerName}
                    className="w-full h-full object-cover"
                    width={224}
                    height={224}
                    loading="eager"
                    fetchpriority="high"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-primary-600 bg-primary-50">
                  {(providerName || 'P')[0]}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-md">
              <img
                src={statusIconMap[provider?.status || 'available'] || '/active.svg'}
                alt={provider?.status}
                className="h-6 w-6"
              />
            </div>
          </div>
        </div>

        <div className="px-4 mb-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <h1 className="text-xl font-bold text-gray-900">{providerName}</h1>
            <p className="text-sm font-medium text-primary-600 mt-0.5">{categoryName}</p>
            {provider?.description && (
              <p className="text-sm text-gray-500 mt-2 leading-relaxed break-words">
                {shortDescription}
                {provider.description.length > 150 && (
                  <button onClick={() => setShowFullDescription(true)} className="text-primary-600 hover:underline ml-1 font-medium">See more</button>
                )}
              </p>
            )}
            <div className="flex justify-center mt-3 items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {statusLabel[provider?.status || 'available'] || 'Active now'}
              </span>
              {provider?.profile?.is_verified && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white text-green-700 text-xs font-semibold rounded-full border border-green-400">
                  <img src="/verify.png" alt="Verified" className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-2 mb-6">
          <div className="flex flex-nowrap gap-1 justify-center">
            <button onClick={() => requireAuth(() => setShowBookingModal(true))} className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-2 py-1.5 bg-primary-600 text-white text-[10px] font-semibold rounded-xl w-14 shadow-md shadow-primary-600/20">
              <Calendar className="h-4 w-4" /><span>Book</span>
            </button>
            <button onClick={() => requireAuth(openChat)} className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-2 py-1.5 border border-gray-200 bg-white text-gray-700 text-[10px] font-semibold rounded-xl w-14 shadow-sm">
              <MessageCircle className="h-4 w-4" /><span>Message</span>
            </button>
            <button onClick={() => requireAuth(() => setShowReportModal(true))} className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-2 py-1.5 border border-red-200 bg-red-50 text-red-600 text-[10px] font-semibold rounded-xl w-14 shadow-sm">
              <Flag className="h-4 w-4" /><span>Report</span>
            </button>
            <button onClick={shareProviderLink} className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-2 py-1.5 border border-gray-200 bg-white text-gray-700 text-[10px] font-semibold rounded-xl w-14 shadow-sm">
              <Share2 className="h-4 w-4" /><span>Share</span>
            </button>
            {!showPhone ? (
              <button onClick={() => requireAuth(() => setShowPhone(true))} className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-2 py-1.5 border border-primary-200 bg-primary-50 text-primary-700 text-[10px] font-semibold rounded-xl w-14 shadow-sm">
                <Phone className="h-4 w-4" /><span>Contact</span>
              </button>
            ) : (
              <a href={`tel:${provider?.profile?.phone || ''}`} className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-2 py-1.5 bg-primary-50 text-primary-700 text-[10px] font-semibold rounded-xl w-14 shadow-sm">
                <Phone className="h-4 w-4" /><span className="truncate max-w-[50px]">{provider?.profile?.phone || 'No phone'}</span>
              </a>
            )}
            <div className="flex-shrink-0 flex flex-col items-center justify-center w-14">
              <FavoriteButton providerId={id!} size="md" />
            </div>
          </div>
        </div>

        <div className="px-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200">
                <MapPin className="h-3.5 w-3.5 text-primary-500" /> {locationString}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200">
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /> {avgRating.toFixed(1)} ({provider?.reviews?.length || 0})
              </span>
              <span className="inline-flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200">
                <Calendar className="h-3.5 w-3.5 text-gray-400" /> {provider?.completedBookings} bookings
              </span>
              <span className="inline-flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200">
                <Clock className="h-3.5 w-3.5 text-gray-400" /> {lastSeen}
              </span>
              {joinedYear && (
                <span className="inline-flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200">
                  <User className="h-3.5 w-3.5 text-gray-400" /> Joined {joinedYear}
                </span>
              )}
            </div>
          </div>
        </div>

        {provider?.portfolio_images?.length > 0 && (
          <div className="px-4 mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-gray-300 rounded-full"></span> Portfolio
            </h2>
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-2"
              onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
              {provider.portfolio_images.map((image) => (
                <Link key={image.id} href={`/provider/${id}/portfolio`} className="snap-start flex-shrink-0 w-40 h-40 rounded-2xl overflow-hidden bg-gray-100 shadow-md border border-gray-200/60">
                  <OptimizedImage src={image.image_url} alt={image.title || 'Portfolio'} className="w-full h-full object-cover" width={320} height={320} />
                </Link>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Swipe to see more →</p>
          </div>
        )}

        {provider?.services?.length > 0 && (
          <div className="px-4 mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-gray-300 rounded-full"></span> Services
            </h2>
            <div className="space-y-3">
              {provider.services.map((service) => (
                <div key={service.id} className="flex justify-between items-start bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{service.name}</p>
                    {service.description && <p className="text-xs text-gray-500 mt-1 break-words">{service.description}</p>}
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="font-bold text-primary-600 text-sm">₦{service.price.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 font-medium">{priceTypeLabels[service.price_type]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 mb-6">
          <Card>
            <h2 className="text-base font-bold text-gray-900 mb-3">About</h2>
            {provider?.description && <p className="text-sm text-gray-600 mb-4 leading-relaxed break-words">{provider.description}</p>}
            <div className="flex flex-wrap gap-2">
              {provider?.profile?.education && <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 rounded-full px-3 py-1.5 text-xs font-medium border border-primary-200"><GraduationCap className="h-3.5 w-3.5" /> {provider.profile.education}</span>}
              {provider?.profile?.languages && <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 rounded-full px-3 py-1.5 text-xs font-medium border border-primary-200"><Languages className="h-3.5 w-3.5" /> {provider.profile.languages}</span>}
              {provider?.profile?.gender && <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 rounded-full px-3 py-1.5 text-xs font-medium border border-primary-200"><User className="h-3.5 w-3.5" /> {provider.profile.gender}</span>}
              {provider?.profile?.age && <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 rounded-full px-3 py-1.5 text-xs font-medium border border-primary-200"><Calendar className="h-3.5 w-3.5" /> {provider.profile.age} years</span>}
            </div>
          </Card>
        </div>

        <div className="px-4 mb-8">
          <Card>
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">Reviews</h2>
            <ReviewsList reviews={(provider?.reviews || []) as any} />
          </Card>
        </div>

        {similarProviders && similarProviders.length > 0 && (
          <div className="px-4 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2"><span className="w-1 h-5 bg-gray-300 rounded-full"></span> Similar Providers</h2>
              <div className="flex border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <button onClick={() => setSimilarViewMode('grid')} className={cn('p-1.5 text-gray-500 hover:text-primary-600', similarViewMode === 'grid' && 'bg-primary-50 text-primary-600')}><LayoutGrid className="h-4 w-4" /></button>
                <button onClick={() => setSimilarViewMode('list')} className={cn('p-1.5 text-gray-500 hover:text-primary-600', similarViewMode === 'list' && 'bg-primary-50 text-primary-600')}><List className="h-4 w-4" /></button>
              </div>
            </div>
            {similarViewMode === 'grid' ? (
              <div className="columns-2 gap-3">
                {similarProviders.map((p: any) => <div key={p.id} className="mb-3 break-inside-avoid"><ProviderCardPortrait provider={p} /></div>)}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {similarProviders.map((p: any) => <ProviderCardHorizontal key={p.id} provider={p} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========== DESKTOP LAYOUT ========== */}
      <div className="hidden md:block">
        <Breadcrumbs items={breadcrumbItems} />
        <button onClick={() => router.back()} className="mb-4 flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors font-medium">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to results
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="relative h-56 bg-gray-100 overflow-hidden">
            {provider?.profile?.cover_photo ? (
              <button onClick={() => setCoverModalOpen(true)} className="w-full h-full relative group">
                <img
                  src={provider.profile.cover_photo}
                  alt="Cover"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-50" />
            )}
          </div>

          <div className="px-6 sm:px-8 pt-6 pb-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="relative w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white flex-shrink-0 -mt-16">
                {provider?.profile?.avatar_url ? (
                  <button onClick={() => setAvatarModalOpen(true)} className="w-full h-full relative group">
                    <OptimizedImage src={provider.profile.avatar_url} alt={providerName} className="w-full h-full object-cover" width={256} height={256} loading="eager" fetchpriority="high" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-primary-600 bg-primary-50">{(providerName || 'P')[0]}</div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-3 mb-1 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{providerName}</h1>
                  <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-200">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    {statusLabel[provider?.status || 'available'] || 'Available for Booking'}
                  </span>
                  {provider?.profile?.is_verified && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-white text-green-700 text-xs font-semibold rounded-full border border-green-400">
                      <img src="/verify.png" alt="Verified" className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-primary-600">{categoryName}</p>
                {provider?.description && (
                  <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
                    {shortDescription}
                    {provider.description.length > 150 && (
                      <button onClick={() => setShowFullDescription(true)} className="text-primary-600 hover:underline ml-1 font-medium">See more</button>
                    )}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-0 sm:mt-0">
                <button onClick={() => requireAuth(() => setShowBookingModal(true))} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 shadow-md shadow-primary-600/20 transition-all"><Calendar className="h-5 w-5" /> Book</button>
                <button onClick={() => requireAuth(openChat)} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 bg-white text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 shadow-sm transition-all"><MessageCircle className="h-5 w-5" /> Message</button>
                <button onClick={() => requireAuth(() => setShowReportModal(true))} className="flex items-center gap-2 px-5 py-2.5 border border-red-200 bg-red-50 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 shadow-sm transition-all"><Flag className="h-5 w-5" /> Report</button>
                <button onClick={shareProviderLink} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 bg-white text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 shadow-sm transition-all"><Share2 className="h-5 w-5" /> Share</button>
                {!showPhone ? (
                  <button onClick={() => requireAuth(() => setShowPhone(true))} className="flex items-center gap-2 px-5 py-2.5 border border-primary-200 bg-primary-50 text-primary-700 text-sm font-semibold rounded-xl hover:bg-primary-100 shadow-sm transition-all"><Phone className="h-5 w-5" /> Contact</button>
                ) : (
                  <a href={`tel:${provider?.profile?.phone || ''}`} className="flex items-center gap-2 px-5 py-2.5 border border-primary-200 bg-primary-50 text-primary-700 text-sm font-semibold rounded-xl hover:bg-primary-100 shadow-sm transition-all"><Phone className="h-5 w-5" /> {provider?.profile?.phone || 'No phone'}</a>
                )}
                <div className="flex items-center"><FavoriteButton providerId={id!} size="md" className="border border-gray-200 rounded-xl p-2 hover:bg-gray-50" /></div>
              </div>
            </div>
          </div>

          <div className="mx-6 border-t border-gray-100 pt-4 pb-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100"><MapPin className="h-4 w-4 text-primary-500" /><span>{locationString}</span></div>
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100"><Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /><span>{avgRating.toFixed(1)} ({provider?.reviews?.length || 0} reviews)</span></div>
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100"><Calendar className="h-4 w-4 text-gray-400" /><span>{provider?.completedBookings} bookings</span></div>
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100"><Clock className="h-4 w-4 text-gray-400" /><span>Last seen {lastSeen}</span></div>
              {joinedYear && <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100"><User className="h-4 w-4 text-gray-400" /><span>Joined {joinedYear}</span></div>}
              {provider?.profile?.gender && <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100"><User className="h-4 w-4 text-gray-400" /><span>{provider.profile.gender}</span></div>}
              {provider?.profile?.age && <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100"><Calendar className="h-4 w-4 text-gray-400" /><span>{provider.profile.age} years old</span></div>}
              {provider?.profile?.education && <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100"><GraduationCap className="h-4 w-4 text-gray-400" /><span>{provider.profile.education}</span></div>}
              {provider?.profile?.languages && <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100"><Languages className="h-4 w-4 text-gray-400" /><span>{provider.profile.languages}</span></div>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {provider?.services?.length > 0 && (
            <Card>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Package className="h-5 w-5 text-primary-600" /> Services & Pricing</h2>
              <div className="space-y-4">
                {provider.services.map((service) => (
                  <div key={service.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{service.name}</p>
                      {service.description && <p className="text-sm text-gray-500 mt-1 break-words">{service.description}</p>}
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="font-bold text-primary-600">₦{service.price.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 font-medium">{priceTypeLabels[service.price_type]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {provider?.portfolio_images?.length > 0 && (
            <Card>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Package className="h-5 w-5 text-primary-600" /> Portfolio</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {provider.portfolio_images.map((image, idx) => (
                  <Link key={image.id} href={`/provider/${id}/portfolio`} className="overflow-hidden rounded-lg hover:opacity-90 transition-opacity">
                    <OptimizedImage src={image.image_url} alt={image.title || 'Portfolio'} className="w-full aspect-square object-cover" width={600} height={600} />
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <h2 className="text-lg font-bold text-gray-900 mb-4">About</h2>
            {provider?.description && <p className="text-sm text-gray-600 mb-4 leading-relaxed">{provider.description}</p>}
            <div className="flex flex-wrap gap-2">
              {provider?.profile?.education && <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 rounded-full px-3 py-1.5 text-xs font-medium border border-primary-200"><GraduationCap className="h-4 w-4" /> {provider.profile.education}</span>}
              {provider?.profile?.languages && <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 rounded-full px-3 py-1.5 text-xs font-medium border border-primary-200"><Languages className="h-4 w-4" /> {provider.profile.languages}</span>}
              {provider?.profile?.gender && <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 rounded-full px-3 py-1.5 text-xs font-medium border border-primary-200"><User className="h-4 w-4" /> {provider.profile.gender}</span>}
              {provider?.profile?.age && <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 rounded-full px-3 py-1.5 text-xs font-medium border border-primary-200"><Calendar className="h-4 w-4" /> {provider.profile.age} years</span>}
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Reviews</h2>
            <ReviewsList reviews={(provider?.reviews || []) as any} />
          </Card>
        </div>

        {similarProviders && similarProviders.length > 0 && (
          <div className="mt-8 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><span className="w-1 h-6 bg-gray-300 rounded-full"></span> Similar Providers</h2>
              <Link href={`/search?category=${encodeURIComponent(provider?.selected_category_slug || '')}`} className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 bg-primary-50 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {similarProviders.map((p: any) => (
                <ProviderCardPortrait key={p.id} provider={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {avatarModalOpen && provider?.profile?.avatar_url && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setAvatarModalOpen(false)}>
          <button className="absolute top-4 right-4 text-white" onClick={() => setAvatarModalOpen(false)}>
            <X className="h-8 w-8" />
          </button>
          <img src={provider.profile.avatar_url} alt={providerName} className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {coverModalOpen && provider?.profile?.cover_photo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setCoverModalOpen(false)}>
          <button className="absolute top-4 right-4 text-white" onClick={() => setCoverModalOpen(false)}>
            <X className="h-8 w-8" />
          </button>
          <img src={provider.profile.cover_photo} alt={`${providerName} cover`} className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {showFullDescription && provider?.description && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowFullDescription(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">About {providerName}</h3>
              <button onClick={() => setShowFullDescription(false)}><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words">{provider.description}</p>
          </div>
        </div>
      )}

      {showBookingModal && (
        <BookingFormModal isOpen={showBookingModal} onClose={() => setShowBookingModal(false)} providerId={id} providerName={providerName} providerVerified={provider?.profile?.is_verified || false} />
      )}

      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Leave a Review</h2>
              <button onClick={() => setShowReviewModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div><label className="block text-sm font-medium mb-2">Rating</label><div className="flex gap-1">{[1,2,3,4,5].map(star => <button key={star} type="button" onClick={() => setReviewRating(star)}><Star className={cn('h-8 w-8', star <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')} /></button>)}</div></div>
              <div><label className="block text-sm font-medium mb-1">Your Review (optional)</label><textarea value={reviewContent} onChange={(e) => setReviewContent(e.target.value)} rows={4} className="w-full px-3 py-2 border rounded-lg" placeholder="Share your experience..." /></div>
              <div className="flex gap-3 pt-2"><button onClick={() => setShowReviewModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button><button onClick={submitReview} disabled={submittingReview} className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50">{submittingReview ? 'Submitting...' : 'Submit Review'}</button></div>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Report Provider</h2>
              <button onClick={() => setShowReportModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">Please let us know why you're reporting this provider.</p>
              <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} rows={4} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., Fake profile, inappropriate content, etc." />
              <div className="flex gap-3 pt-2"><button onClick={() => setShowReportModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button><button onClick={submitReport} disabled={submittingReport} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">{submittingReport ? 'Submitting...' : 'Submit Report'}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}