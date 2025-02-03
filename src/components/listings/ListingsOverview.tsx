import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Filter, Heart, Loader2, MapPin, Package, RefreshCw, Search, SlidersHorizontal, Smartphone, Shirt, Sofa, Dumbbell, Car, BookOpen, Diamond, Flower, Gamepad, MoreHorizontal, X } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { useFavorite } from '@/hooks/use-favorites';
import { searchLocations } from '@/lib/utils/location';
import type { Tables } from '@/lib/supabase';
import { useSearchParams } from 'react-router-dom';

interface ListingsOverviewProps {
  defaultType?: 'fixed_price' | 'auction' | 'giveaway' | 'trade';
  sellerId?: string;
}

type ListingWithImages = Tables['listings']['Row'] & {
  listing_images: Tables['listing_images']['Row'][];
};

const categories = [
  { value: 'Alle', icon: Filter, color: 'bg-gray-100 hover:bg-gray-200' },
  { value: 'Elektronik', icon: Smartphone, color: 'bg-blue-100 hover:bg-blue-200' },
  { value: 'Mode', icon: Shirt, color: 'bg-pink-100 hover:bg-pink-200' },
  { value: 'Möbel', icon: Sofa, color: 'bg-amber-100 hover:bg-amber-200' },
  { value: 'Sport', icon: Dumbbell, color: 'bg-green-100 hover:bg-green-200' },
  { value: 'Auto & Motorrad', icon: Car, color: 'bg-red-100 hover:bg-red-200' },
  { value: 'Bücher & Medien', icon: BookOpen, color: 'bg-purple-100 hover:bg-purple-200' },
  { value: 'Sammeln', icon: Diamond, color: 'bg-indigo-100 hover:bg-indigo-200' },
  { value: 'Garten', icon: Flower, color: 'bg-lime-100 hover:bg-lime-200' },
  { value: 'Spielzeug', icon: Gamepad, color: 'bg-orange-100 hover:bg-orange-200' },
  { value: 'Sonstiges', icon: MoreHorizontal, color: 'bg-gray-100 hover:bg-gray-200' },
];

const sortOptions = [
  { value: 'newest', label: 'Neueste zuerst' },
  { value: 'oldest', label: 'Älteste zuerst' },
  { value: 'price_asc', label: 'Preis aufsteigend' },
  { value: 'price_desc', label: 'Preis absteigend' },
];

export function ListingsOverview({ defaultType, sellerId }: ListingsOverviewProps = {}) {
  const [listings, setListings] = useState<ListingWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isResetting, setIsResetting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'Alle');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000, error: '', enabled: false });
  const [filters, setFilters] = useState({
    onlyWithShipping: false,
    onlyWithTrade: false,
    condition: 'all' as 'all' | 'new' | 'used',
  });

  // Location search state
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat?: number;
    lng?: number;
    display_name?: string;
  } | null>(null);
  const [radius, setRadius] = useState(10);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const resetFilters = () => {
    setIsResetting(true);
    setSearchTerm('');
    setLocationQuery('');
    setSelectedLocation(null);
    setRadius(10);
    setSelectedCategory('Alle');
    setSortBy('newest');
    setPriceRange({ min: 0, max: 100000, error: '', enabled: false });
    setFilters({
      onlyWithShipping: false,
      onlyWithTrade: false,
      condition: 'all',
    });
    searchParams.delete('category');
    setSearchParams(searchParams);
    setIsResetting(false);
  };

  // Handle location search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (locationQuery.length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        const suggestions = await searchLocations(locationQuery);
        setLocationSuggestions(suggestions);
        setShowSuggestions(true);
      }, 300);
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [locationQuery]);

  const handleLocationSelect = (suggestion: any) => {
    setSelectedLocation({
      lat: suggestion.lat,
      lng: suggestion.lon,
      display_name: suggestion.display_name
    });
    setLocationQuery(suggestion.display_name);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchListings();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedLocation, radius, selectedCategory, sortBy, priceRange, filters]);

  async function fetchListings() {
    setLoading(true);
    try {
      let query = supabase
        .from('listings')
        .select(`
          *,
          listing_images (*)
        `)
        .eq('status', 'active');

      // Apply seller filter if provided
      if (sellerId) {
        query = query.eq('user_id', sellerId);
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Apply category filter
      if (selectedCategory !== 'Alle') {
        query = query.eq('category', selectedCategory);
      }

      // Apply location filter
      if (selectedLocation?.lat && selectedLocation?.lng) {
        const { data: nearbyListings } = await supabase.rpc('search_listings_within_radius', {
          center_lat: selectedLocation.lat,
          center_lng: selectedLocation.lng,
          radius_km: radius
        });
        
        if (nearbyListings) {
          query = query.in('id', nearbyListings.map(l => l.id));
        }
      }

      // Apply type filter
      if (defaultType) {
        switch (defaultType) {
          case 'fixed_price':
            query = query.eq('type', 'fixed_price');
            break;
          case 'auction':
            query = query.eq('type', 'auction');
            break;
          case 'giveaway':
            query = query.eq('type', 'fixed_price').eq('price', 0);
            break;
          case 'trade':
            query = query.eq('allow_trade', true);
            break;
        }
      }

      // Apply price filter
      if (priceRange.enabled) {
        query = query.gte('price', priceRange.min);
        query = query.lte('price', priceRange.max);
      }

      // Apply additional filters
      if (filters.onlyWithShipping) {
        query = query.eq('shipping_available', true);
      }
      if (filters.onlyWithTrade) {
        query = query.eq('allow_trade', true);
      }
      if (filters.condition !== 'all') {
        query = query.eq('condition', filters.condition);
      }

      // Apply sorting
      switch (sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        default: // newest
          query = query.order('created_at', { ascending: false });
      }

      const { data: listings, error } = await query;

      if (error) throw error;

      setListings(listings || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: 'Fehler beim Laden der Inserate',
        description: 'Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
      setListings([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 pt-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Alle Inserate</h1>
          <p className="text-muted-foreground">
            {listings.length} Inserate gefunden
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto shrink-0">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suche nach Inseraten..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter & Sortierung</SheetTitle>
                <SheetDescription className="flex flex-col gap-4">
                  <span>Passe die Anzeige der Inserate an deine Bedürfnisse an.</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    disabled={isResetting}
                    className="self-end text-muted-foreground hover:text-foreground"
                  >
                    Filter zurücksetzen
                  </Button>
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Location Search */}
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium">Standort</label>
                    <div className="space-y-4 mt-2">
                      <div className="relative">
                        <Input
                          placeholder="Ort eingeben..."
                          value={locationQuery}
                          onChange={(e) => setLocationQuery(e.target.value)}
                          className="w-full"
                        />
                        {showSuggestions && locationSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                            {locationSuggestions.map((suggestion) => (
                              <button
                                key={suggestion.place_id}
                                className="w-full px-4 py-2 text-left hover:bg-secondary/50 transition-colors space-y-1"
                                onClick={() => handleLocationSelect(suggestion)}
                              >
                                <div className="font-medium">
                                  {suggestion.city || suggestion.canton}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {suggestion.formatted_name}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {selectedLocation && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-muted-foreground mb-2">
                              Umkreis: {radius} km
                            </label>
                            <Slider
                              value={[radius]}
                              onValueChange={(value) => setRadius(value[0])}
                              min={0}
                              max={100}
                              step={5}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kategorie</label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                      if (value === 'Alle') {
                        searchParams.delete('category');
                      } else {
                        searchParams.set('category', value);
                      }
                      setSearchParams(searchParams);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wähle eine Kategorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(({ value, icon: Icon }) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {value}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sortierung</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Preisbereich</label>
                    <Switch
                      checked={priceRange.enabled}
                      onCheckedChange={(checked) =>
                        setPriceRange(prev => ({ ...prev, enabled: checked }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-2">Von</label>
                      <Input
                        type="number"
                        min={0}
                        max={priceRange.max}
                        value={priceRange.min}
                        disabled={!priceRange.enabled}
                        onChange={(e) => setPriceRange(prev => ({
                          ...prev,
                          min: Math.max(0, parseInt(e.target.value) || 0),
                          error: ''
                        }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-2">Bis</label>
                      <Input
                        type="number"
                        min={priceRange.min}
                        max={100000}
                        value={priceRange.max}
                        disabled={!priceRange.enabled}
                        onChange={(e) => {
                          const newMax = parseInt(e.target.value) || 0;
                          setPriceRange(prev => ({
                            ...prev,
                            max: newMax,
                            error: newMax <= prev.min 
                              ? "Der 'Bis'-Wert muss höher als der 'Von'-Wert sein."
                              : ''
                          }));
                        }}
                        className={`w-full ${priceRange.error ? 'border-destructive' : ''}`}
                      />
                      {priceRange.error && (
                        <p className="text-xs text-destructive mt-1">
                          {priceRange.error}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{priceRange.min} CHF</span>
                    <span>{priceRange.max} CHF</span>
                  </div>
                </div>

                {/* Additional Filters */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Nur mit Versand</label>
                    <Switch
                      checked={filters.onlyWithShipping}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({ ...prev, onlyWithShipping: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Nur mit Tausch</label>
                    <Switch
                      checked={filters.onlyWithTrade}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({ ...prev, onlyWithTrade: checked }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Zustand</label>
                    <Select
                      value={filters.condition}
                      onValueChange={(value: 'all' | 'new' | 'used') =>
                        setFilters((prev) => ({ ...prev, condition: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle</SelectItem>
                        <SelectItem value="new">Neu</SelectItem>
                        <SelectItem value="used">Gebraucht</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Category Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {categories.map((category) => (
          <Button
            key={category.value}
            variant="ghost"
            className={`shrink-0 ${
              selectedCategory === category.value ? 'bg-primary text-primary-foreground hover:bg-primary/90' : category.color
            }`}
            onClick={() => {
              setSelectedCategory(category.value);
              if (category.value === 'Alle') {
                searchParams.delete('category');
              } else {
                searchParams.set('category', category.value);
              }
              setSearchParams(searchParams);
            }}
          >
            <category.icon className="h-4 w-4 mr-2" />
            {category.value}
          </Button>
        ))}
      </div>

      {/* Active Filters */}
      {(selectedCategory !== 'Alle' ||
        selectedLocation ||
        priceRange.enabled ||
        filters.onlyWithShipping ||
        filters.onlyWithTrade ||
        filters.condition !== 'all') && (
        <div className="flex flex-wrap gap-2 mb-6">
          {selectedCategory !== 'Alle' && (
            <div className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {selectedCategory}
            </div>
          )}
          {selectedLocation && (
            <div className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {`${selectedLocation.display_name} (${radius} km)`}
              <button
                onClick={() => {
                  setSelectedLocation(null);
                  setLocationQuery('');
                }}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {priceRange.enabled && (
            <div className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <span>
                {priceRange.min.toLocaleString('de-DE')} - {priceRange.max.toLocaleString('de-DE')} CHF
              </span>
              <button
                onClick={() => setPriceRange(prev => ({ ...prev, enabled: false }))}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {filters.onlyWithShipping && (
            <div className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              Mit Versand
            </div>
          )}
          {filters.onlyWithTrade && (
            <div className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Mit Tausch
            </div>
          )}
          {filters.condition !== 'all' && (
            <div className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
              {filters.condition === 'new' ? 'Neu' : 'Gebraucht'}
            </div>
          )}
        </div>
      )}

      {/* Listings Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all border border-border/40 hover:border-primary/20"
            >
              <Link to={`/listings/${listing.id}`}>
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
                  <div className="absolute top-2 right-2">
                    <FavoriteButton listingId={listing.id} />
                  </div>
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

                  {/* Location & Options */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{(listing.location as any).address.split(',')[0]}</span>
                    </div>
                    {listing.shipping_available && (
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        <span>Versand</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Keine Inserate gefunden</p>
        </div>
      )}
    </div>
  );
}

function FavoriteButton({ listingId }: { listingId: string }) {
  const { isFavorite, isLoading, toggleFavorite } = useFavorite(listingId);
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <button
        className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
        onClick={(e) => {
          e.preventDefault();
          if (!isLoading) {
            toggleFavorite(() => setShowAuthModal(true));
          }
        }}
        disabled={isLoading}
      >
        {isFavorite ? (
          <Heart className="h-4 w-4 text-red-500 fill-current" />
        ) : (
          <Heart className="h-4 w-4" />
        )}
      </button>

      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
        onSuccess={() => {
          setShowAuthModal(false);
          toggleFavorite();
        }}
      />
    </>
  );
}