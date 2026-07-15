// src/app/provider/[id]/portfolio/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { NimartSpinner } from '@/components/common/NimartSpinner';
import { OptimizedImage } from '@/components/common/OptimizedImage';

export default function ProviderPortfolio() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['provider-portfolio', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('portfolio_images')
        .select('*')
        .eq('provider_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NimartSpinner size="lg" />
      </div>
    );
  }

  if (!portfolio || portfolio.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-500">No portfolio images available.</p>
        <button onClick={() => router.back()} className="mt-4 text-primary-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const currentImage = portfolio[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
  };
  const goToNext = () => {
    setCurrentIndex(prev => (prev < portfolio.length - 1 ? prev + 1 : prev));
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header with back arrow and counter */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 text-white">
        <button
          onClick={() => router.back()}
          className="bg-black/30 backdrop-blur-sm p-2 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium">
          {currentIndex + 1} / {portfolio.length}
        </span>
        <div className="w-10" /> {/* spacer for centering */}
      </div>

      {/* Main image */}
      <div className="flex-1 relative flex items-center justify-center">
        <OptimizedImage
          src={currentImage.image_url}
          alt={currentImage.title || 'Portfolio image'}
          className="max-h-full max-w-full object-contain"
          width={1200}
          height={800}
        />

        {/* Navigation arrows */}
        {portfolio.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm text-white rounded-full disabled:opacity-30"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex === portfolio.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm text-white rounded-full disabled:opacity-30"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="py-3 px-4 bg-black/60 backdrop-blur-sm">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar justify-center">
          {portfolio.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setCurrentIndex(idx)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? 'border-white opacity-100'
                  : 'border-transparent opacity-60'
              }`}
            >
              <OptimizedImage
                src={img.image_url}
                alt={img.title || 'Portfolio thumbnail'}
                className="w-full h-full object-cover"
                width={64}
                height={64}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}