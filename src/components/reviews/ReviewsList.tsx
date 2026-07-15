import { Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';

interface Review {
  id: string;
  rating: number;
  content: string | null;
  created_at: string;
  reviewer?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ReviewsListProps {
  reviews: Review[];
}

export function ReviewsList({ reviews }: ReviewsListProps) {
  if (!reviews.length) {
    return <p className="text-gray-500 text-sm">No reviews yet.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
          <div className="flex items-start gap-3">
            {review.reviewer?.avatar_url ? (
              <img
                src={review.reviewer.avatar_url}
                alt={review.reviewer.full_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-medium">
                  {review.reviewer?.full_name?.[0] || '?'}
                </span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {review.reviewer?.full_name || 'Anonymous'}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'h-4 w-4',
                      star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    )}
                  />
                ))}
              </div>
              {review.content && <p className="mt-2 text-gray-700 text-sm">{review.content}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}