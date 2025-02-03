import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { RatingStars } from './RatingStars';

interface Rating {
  id: string;
  overall_rating: number;
  communication_rating: number;
  reliability_rating: number;
  comment: string;
  created_at: string;
  rater: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

interface RatingsListProps {
  ratings: Rating[] | null;
}

export function RatingsList({ ratings }: RatingsListProps) {
  if (!ratings || ratings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Noch keine Bewertungen vorhanden.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ratings.map((rating) => (
        <div key={rating.id} className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <RatingStars rating={rating.overall_rating} size="lg" />
                <span className="text-lg font-semibold">
                  {rating.overall_rating.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                von {rating.rater.username} am{' '}
                {format(new Date(rating.created_at), 'PPP', { locale: de })}
              </p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <span>Kommunikation:</span>
                <RatingStars rating={rating.communication_rating} size="sm" />
              </div>
              <div className="flex items-center gap-2">
                <span>Zuverlässigkeit:</span>
                <RatingStars rating={rating.reliability_rating} size="sm" />
              </div>
            </div>
          </div>
          <p className="text-muted-foreground">{rating.comment}</p>
        </div>
      ))}
    </div>
  );
}