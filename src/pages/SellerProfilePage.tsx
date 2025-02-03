import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, User, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { ListingsOverview } from '@/components/listings/ListingsOverview';
import { RatingSummary } from '@/components/ratings/RatingSummary';
import { RatingsList } from '@/components/ratings/RatingsList';
import { RatingForm } from '@/components/ratings/RatingForm';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface SellerProfile {
  id: string;
  username: string;
  avatar_url?: string;
}

interface RatingStats {
  total_ratings: number;
  avg_communication: number;
  avg_reliability: number;
  avg_overall: number;
  recent_ratings: any[];
}

export function SellerProfilePage() {
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [canRate, setCanRate] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { sellerId } = useParams<{ sellerId: string }>();
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get('listingId');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSellerProfile() {
      if (!sellerId) return;
      
      try {
        // Fetch seller profile
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', sellerId)
          .single();

        if (error) throw error;
        setSeller(data);

        // Fetch rating stats
        const { data: stats, error: statsError } = await supabase
          .rpc('get_user_ratings', { user_id: sellerId });

        if (statsError) throw statsError;
        setRatingStats(stats);

        // Check if the user can rate the seller
        if (user) {
          const { data: canRateData, error: canRateError } = await supabase
            .rpc('can_rate_user', {
              input_rater_id: user.id,
              input_rated_id: sellerId
            });

          if (canRateError) throw canRateError;
          setCanRate(canRateData);

          if (canRateData) {
            // Get the completed transaction for rating
            const { data: transactionData } = await supabase
              .from('transactions')
              .select('*')
              .eq('seller_id', sellerId)
              .eq('buyer_id', user.id)
              .eq('status', 'completed')
              .single();

            setCompletedTransaction(transactionData);
          }
        }
      } catch (error) {
        console.error('Error fetching seller profile:', error);
        toast({
          title: 'Fehler beim Laden',
          description: 'Die Profildaten konnten nicht geladen werden.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchSellerProfile();
  }, [sellerId, user]);

  const handleRatingSuccess = () => {
    setShowRatingForm(false);
    fetchSellerProfile();
    toast({
      title: 'Bewertung gespeichert',
      description: 'Vielen Dank für Ihre Bewertung!',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Verkäufer nicht gefunden</h2>
        <p className="text-muted-foreground">
          Das gesuchte Profil existiert nicht oder wurde gelöscht.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      {/* Back Button */}
      {listingId && (
        <Button
          variant="ghost"
          className="hover:bg-transparent hover:text-primary -ml-3 mb-8"
          asChild
        >
          <Link to={`/listings/${listingId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Inserat
          </Link>
        </Button>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border p-8 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
            {seller.avatar_url ? (
              <img
                src={seller.avatar_url}
                alt={seller.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{seller.username}</h1>
            <div className="flex items-center gap-4">
              {ratingStats && ratingStats.total_ratings > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-medium">{ratingStats.avg_overall.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({ratingStats.total_ratings} {ratingStats.total_ratings === 1 ? 'Bewertung' : 'Bewertungen'})
                  </span>
                </div>
              )}
              {canRate && !showRatingForm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRatingForm(true)}
                >
                  Bewertung abgeben
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Rating Form */}
        {showRatingForm && completedTransaction && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Bewertung abgeben</h2>
            <RatingForm
              transactionId={completedTransaction.id}
              ratedUserId={seller.id}
              onSuccess={handleRatingSuccess}
              onCancel={() => setShowRatingForm(false)}
            />
          </div>
        )}

        {/* Rating Summary & List */}
        {ratingStats && (
          <div className="mt-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-lg font-semibold mb-4">Bewertungsübersicht</h2>
                <RatingSummary
                  totalRatings={ratingStats.total_ratings}
                  avgCommunication={ratingStats.avg_communication}
                  avgReliability={ratingStats.avg_reliability}
                  avgOverall={ratingStats.avg_overall}
                />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Letzte Bewertungen</h2>
              <RatingsList ratings={ratingStats.recent_ratings} />
            </div>
          </div>
        )}
      </div>

      {/* Active Listings */}
      <div className="mt-12 space-y-8">
        <h2 className="text-lg font-semibold">Aktive Inserate</h2>
        <ListingsOverview sellerId={seller.id} />
      </div>
    </div>
  );
}