// src/components/common/FavoriteButton.tsx
'use client';

import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/supabase-any';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface FavoriteButtonProps {
  providerId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FavoriteButton({ providerId, className, size = 'md' }: FavoriteButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. Use React Query to cache the favorite status
  const { data: isFavorite = false } = useQuery({
    queryKey: ['favorite', providerId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { count } = await db
        .from('favorite_providers')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', user.id)
        .eq('provider_id', providerId);
      return (count ?? 0) > 0;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes (stops the loop!)
  });

  // 2. Use a Mutation for the toggle
  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        await db.from('favorite_providers').delete().eq('customer_id', user!.id).eq('provider_id', providerId);
      } else {
        await db.from('favorite_providers').insert({ customer_id: user!.id, provider_id: providerId } as any);
      }
    },
    onSuccess: () => {
      // Instantly update the UI and cache
      queryClient.setQueryData(['favorite', providerId, user?.id], !isFavorite);
      if (!isFavorite) toast.success('Provider saved!');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to save providers');
      router.push('/auth/signin');
      return;
    }
    toggleMutation.mutate();
  }

  const circleSizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const iconSizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={toggleMutation.isPending}
      className={cn(
        'flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all active:scale-90',
        circleSizeClasses[size],
        isFavorite
          ? 'text-red-500 hover:text-red-600'
          : 'text-primary-600 hover:text-primary-700',
        className
      )}
      title={isFavorite ? 'Remove from saved' : 'Save provider'}
    >
      <Heart
        className={cn(
          iconSizeClasses[size],
          'fill-current',
          toggleMutation.isPending && 'animate-pulse'
        )}
      />
    </button>
  );
}