import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, MapPin, Package, RefreshCw, Save } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useListingFormStore } from '@/lib/store';
import { ImageCarousel } from './ImageCarousel';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';

type ListingWithImages = Tables['listings']['Row'] & {
  listing_images: Tables['listing_images']['Row'][];
};

export function ListingPreview() {
  const [listing, setListing] = useState<ListingWithImages | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { formData, imageUrls, clearAll } = useListingFormStore();

  useEffect(() => {
    async function fetchListing() {
      if (!id) return;

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          listing_images (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching listing:', error);
        toast({
          title: 'Fehler beim Laden des Inserats',
          description: 'Bitte versuchen Sie es später erneut',
          variant: 'destructive',
        });
        return;
      }

      setListing(data);
    }

    fetchListing();
  }, [id, toast]);

  const publishListing = async () => {
    if (!listing) return;

    setIsPublishing(true);
    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'pending',
          published_at: new Date().toISOString()
        })
        .eq('id', listing.id);

      if (error) throw error;

      // Clear form data after successful publish
      clearAll();

      toast({
        title: 'Inserat zur Prüfung eingereicht',
        description: 'Ihr Inserat wird von unserem Team geprüft. Sie werden per E-Mail über die Entscheidung informiert.',
      });
      
      navigate('/listings/my');
    } catch (error) {
      console.error('Error publishing listing:', error);
      toast({
        title: 'Fehler beim Einreichen des Inserats',
        description: 'Bitte versuchen Sie es später erneut',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const saveDraft = async () => {
    if (!listing) return;

    setIsSavingDraft(true);
    try {
      const { error } = await supabase
        .from('listings')
        .update({
          status: 'draft',
        })
        .eq('id', listing.id);

      if (error) throw error;

      toast({
        title: 'Entwurf gespeichert',
        description: 'Das Inserat wurde als Entwurf gespeichert.',
      });
      navigate('/listings/my');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Fehler beim Speichern',
        description: 'Der Entwurf konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleCancel = async () => {
    if (!listing) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listing.id);

      if (error) throw error;

      // Clear form data
      clearAll();

      toast({
        title: 'Entwurf gelöscht',
        description: 'Der Entwurf wurde erfolgreich gelöscht.',
      });
      
      navigate('/listings/my');
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: 'Fehler beim Löschen',
        description: 'Der Entwurf konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!listing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Image Gallery */}
        <div className="aspect-video relative bg-muted">
          <ImageCarousel
            images={listing.listing_images || []}
            className="h-full"
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{listing.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground">{listing.category}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {listing.condition === 'new' ? 'Neu' : 'Gebraucht'}
              </span>
            </div>
          </div>

          {/* Price Info */}
          <div className="bg-secondary/50 rounded-lg p-4">
            {listing.type === 'fixed_price' ? (
              <div className="text-2xl font-bold">
                {listing.price?.toLocaleString('de-DE', {
                  style: 'currency',
                  currency: 'CHF',
                })}
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Startpreis:</span>
                  <div className="text-2xl font-bold">
                    {listing.auction_start_price?.toLocaleString('de-DE', {
                      style: 'currency',
                      currency: 'CHF',
                    })}
                  </div>
                </div>
                {listing.auction_min_price && (
                  <div>
                    <span className="text-sm text-muted-foreground">Mindestpreis:</span>
                    <div>
                      {listing.auction_min_price.toLocaleString('de-DE', {
                        style: 'currency',
                        currency: 'CHF',
                      })}
                    </div>
                  </div>
                )}
                {listing.auction_end_time && (
                  <div>
                    <span className="text-sm text-muted-foreground">Auktionsende:</span>
                    <div>
                      {format(new Date(listing.auction_end_time), 'PPp', { locale: de })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Beschreibung</h2>
            <p className="whitespace-pre-wrap">{listing.description}</p>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{(listing.location as any).address}</span>
          </div>

          {/* Options */}
          <div className="flex gap-4">
            {listing.allow_trade && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4" />
                <span>Tausch möglich</span>
              </div>
            )}
            {listing.shipping_available && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>Versand möglich</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isDeleting || isSavingDraft || isPublishing}
          className="text-destructive hover:text-destructive"
        >
          {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Abbrechen
        </Button>
        <Button
          variant="outline"
          onClick={saveDraft}
          disabled={isSavingDraft || isPublishing}
        >
          {isSavingDraft && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Als Entwurf speichern
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (listing) {
              useListingFormStore.getState().setFormData({
                title: listing.title,
                category: listing.category,
                description: listing.description,
                type: listing.type,
                price: listing.price,
                allow_trade: listing.allow_trade,
                shipping_available: listing.shipping_available,
                location: listing.location,
              });
              useListingFormStore.getState().setImageUrls(
                listing.listing_images.map(img => img.url)
              );
            }
            navigate('/listings/new');
          }}
          disabled={isEditing || isPublishing}
        >
          Bearbeiten
        </Button>
        <Button
          onClick={publishListing}
          disabled={isPublishing || isEditing}
        >
          {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Zur Prüfung einreichen
        </Button>
      </div>
    </div>
  );
}