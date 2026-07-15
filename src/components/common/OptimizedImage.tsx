// src/components/common/OptimizedImage.tsx
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useState, useRef, useCallback } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
  loading?: 'lazy' | 'eager';
  fetchpriority?: 'high' | 'low' | 'auto';
}

export function OptimizedImage({
  src,
  alt,
  className,
  width = 400,
  height = 400,
  quality = 80,
  loading = 'lazy',
  fetchpriority = 'auto',
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      if (naturalWidth && naturalHeight) {
        // calculate exact aspect ratio in percentage
        const ratio = (naturalHeight / naturalWidth) * 100;
        setAspectRatio(`${ratio}%`);
      }
      setIsLoaded(true);
    },
    []
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden bg-gray-200',
        className
      )}
      style={
        aspectRatio
          ? { paddingBottom: aspectRatio }
          : { minHeight: '200px' } // placeholder height during load
      }
    >
      {/* Show a subtle pulse skeleton only while the image hasn't loaded */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-300 animate-pulse" />
      )}

      <Image
        src={src}
        alt={alt}
        fill
        quality={quality}
        loading={loading}
        {...(loading === 'eager' ? { priority: true } : {})}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
        className={cn(
          'object-cover transition-opacity duration-500',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={handleLoad}
      />
    </div>
  );
}