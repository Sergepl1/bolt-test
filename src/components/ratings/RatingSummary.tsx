import { RatingStars } from './RatingStars';

interface RatingSummaryProps {
  totalRatings: number;
  avgCommunication: number | null;
  avgReliability: number | null;
  avgOverall: number | null;
}

export function RatingSummary({
  totalRatings,
  avgCommunication,
  avgReliability,
  avgOverall,
}: RatingSummaryProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <RatingStars rating={avgOverall || 0} size="lg" />
          <span className="text-2xl font-bold">{avgOverall?.toFixed(1) || '0.0'}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {totalRatings} {totalRatings === 1 ? 'Bewertung' : 'Bewertungen'}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Kommunikation</span>
          <div className="flex items-center gap-2">
            <RatingStars rating={avgCommunication || 0} size="sm" />
            <span className="text-sm font-medium">{avgCommunication?.toFixed(1) || '0.0'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Zuverlässigkeit</span>
          <div className="flex items-center gap-2">
            <RatingStars rating={avgReliability || 0} size="sm" />
            <span className="text-sm font-medium">{avgReliability?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}