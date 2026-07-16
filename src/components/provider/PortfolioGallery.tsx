import Link from 'next/link';
import { OptimizedImage } from '../common/OptimizedImage';
import type { Database } from '../../types/database';

type PortfolioImageRow = Database['public']['Tables']['portfolio_images']['Row'];

interface PortfolioGalleryProps {
  images: PortfolioImageRow[];
  providerId?: string; // optional: if provided, the first image links to the full gallery
}

export function PortfolioGallery({ images, providerId }: PortfolioGalleryProps) {
  if (!images || images.length === 0) {
    return <p className="text-gray-500 text-sm">No portfolio items yet.</p>;
  }

  // Display up to 8 images in a grid
  const displayImages = images.slice(0, 8);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {displayImages.map((image, index) => {
        const content = (
          <OptimizedImage
            src={image.image_url}
            alt={image.title || 'Portfolio'}
            className="w-full aspect-square rounded-lg object-cover"
            width={300}
            height={300}
          />
        );

        // The first image can link to the full-screen portfolio page
        if (index === 0 && providerId) {
          return (
            <Link
              key={image.id}
              href={`/provider/${providerId}/portfolio`}
              className="overflow-hidden rounded-lg hover:opacity-90 transition-opacity"
            >
              {content}
            </Link>
          );
        }

        return (
          <div key={image.id} className="overflow-hidden rounded-lg">
            {content}
          </div>
        );
      })}
      {images.length > 8 && (
        <div className="flex items-center justify-center bg-gray-100 rounded-lg text-sm text-gray-600">
          +{images.length - 8} more
        </div>
      )}
    </div>
  );
}