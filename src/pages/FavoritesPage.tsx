import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Heart, Loader2, MapPin, Package, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getFavorites } from '@/lib/favorites';
import { useToast } from '@/hooks/use-toast';
import { useFavorite } from '@/hooks/use-favorites';

type FavoriteListing = {
  listing_id: string;
  listings: {
    id: string;
    title: string;
    price: number | null;
    type: 'fixed_price' | 'auction';
    auction_start_price: number | null;
    auction_end_time: string | null;
    location: any;
    category: string;
    listing_images: {
      url: string;
      is_featured: boolean;
    }[];
  };
};

export function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFavorites();
  }, []);

  async function fetchFavorites() {
    try {
      const data = await getFavorites();
      // Filter out favorites where the listing has been deleted
      setFavorites(data.filter(favorite => favorite.listings !== null));
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError('Fehler beim Laden der Favoriten');
      toast({
        title: 'Fehler beim Laden der Favoriten',
        description: 'Bitte versuchen Sie es später erneut',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredFavorites = favorites.filter((favorite) =>
    favorite.listings?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    favorite.listings?.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 pt-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Meine Favoriten</h1>
          <p className="text-muted-foreground">
            {favorites.length} gespeicherte Inserate
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suche in Favoriten..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Favorites Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
        </div>
      ) : filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFavorites.map((favorite) => (
            <FavoriteCard
              key={favorite.listing_id}
              favorite={favorite}
              onRemove={fetchFavorites}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Keine Favoriten</h2>
          <p className="text-muted-foreground mb-6">
            Sie haben noch keine Inserate zu Ihren Favoriten hinzugefügt.
          </p>
          <Button asChild>
            <Link to="/listings">Inserate durchstöbern</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function FavoriteCard({ favorite, onRemove }: { favorite: FavoriteListing; onRemove: () => void }) {
  const { isFavorite, isLoading, toggleFavorite } = useFavorite(favorite.listing_id);
  const listing = favorite.listings;

  if (!listing) {
    return null;
  }

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="aspect-square relative bg-muted">
        {listing.listing_images?.[0] ? (
          <img
            src={listing.listing_images[0].url}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Kein Bild
          </div>
        )}
        <button
          className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          onClick={(e) => {
            e.preventDefault();
            if (!isLoading) {
              toggleFavorite().then(onRemove);
            }
          }}
          disabled={isLoading}
        >
          <Heart className="h-4 w-4 text-red-500 fill-current" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold truncate">{listing.title}</h3>
        <p className="text-sm text-muted-foreground mb-2">
          {listing.category}
        </p>

        {/* Price */}
        <div className="mb-3">
          {listing.type === 'fixed_price' ? (
            <div className="font-semibold">
              {listing.price?.toLocaleString('de-DE', {
                style: 'currency',
                currency: 'CHF',
              })}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="font-semibold">
                Ab{' '}
                {listing.auction_start_price?.toLocaleString('de-DE', {
                  style: 'currency',
                  currency: 'CHF',
                })}
              </div>
              {listing.auction_end_time && (
                <div className="text-xs text-muted-foreground">
                  Endet {format(new Date(listing.auction_end_time), 'PPp', { locale: de })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{listing.location.address.split(',')[0]}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}