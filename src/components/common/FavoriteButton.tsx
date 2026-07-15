// src/components/common/FavoriteButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface FavoriteButtonProps {
  providerId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FavoriteButton({ providerId, className, size = 'md' }: FavoriteButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    checkFavoriteStatus();
  }, [user, providerId]);

  async function checkFavoriteStatus() {
    const { count } = await supabase
      .from('favorite_providers')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', user!.id)
      .eq('provider_id', providerId);
    setIsFavorite((count ?? 0) > 0);
  }

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to save providers');
      router.push('/auth/signin');
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        await supabase
          .from('favorite_providers')
          .delete()
          .eq('customer_id', user.id)
          .eq('provider_id', providerId);
        setIsFavorite(false);
      } else {
        await supabase.from('favorite_providers').insert({
          customer_id: user.id,
          provider_id: providerId,
        });
        setIsFavorite(true);
        toast.success('Provider saved!');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
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
      disabled={loading}
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
          'fill-current', // always filled
          loading && 'animate-pulse'
        )}
      />
    </button>
  );
}