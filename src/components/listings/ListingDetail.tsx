import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Heart, Loader2, MapPin, Package, RefreshCw, MessageSquare, User, AlertTriangle } from 'lucide-react';
import { ImageCarousel } from './ImageCarousel';
import { ShareDialog } from './ShareDialog';
import { ReportDialog } from './ReportDialog';
import { AuthModal } from '@/components/auth/AuthModal';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useFavorite } from '@/hooks/use-favorites';
import type { Tables } from '@/lib/supabase';

type ListingWithImages = Tables['listings']['Row'] & {
  listing_images: Tables['listing_images']['Row'][];
};

export function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<ListingWithImages | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showMessageDialog, setShowMessageDialog] = useState<boolean>(false);
  const [showReportDialog, setShowReportDialog] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<'message' | 'favorite' | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [seller, setSeller] = useState<any>(null);
  const { isFavorite, isLoading: favoriteLoading, toggleFavorite } = useFavorite(id || '', () => {
    setPendingAction('favorite');
    setShowAuthModal(true);
  });
  const [isSending, setIsSending] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchListing() {
      if (!id) return;

      try {
        // First get the listing with images
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select(`
            *,
            listing_images (*)
          `)
          .eq('id', id)
          .single();

        if (listingError) throw listingError;
        setListing(listingData);

        // Check if listing is pending
        setIsPending(listingData.status === 'pending');

        // Then get the seller profile
        const { data: sellerData, error: sellerError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', listingData.user_id)
          .single();

        if (sellerError) throw sellerError;
        setSeller(sellerData || { id: listingData.user_id, username: 'Unbekannter Verkäufer' });

        // Record view
        await supabase
          .from('listing_views')
          .insert([{ listing_id: id }]);
      } catch (error) {
        console.error('Error fetching listing:', error);
        toast({
          title: 'Fehler beim Laden des Inserats',
          description: 'Bitte versuchen Sie es später erneut',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchListing();
  }, [id, toast]);

  const handleMessage = async () => {
    if (!user) {
      setPendingAction('message');
      setShowAuthModal(true);
      return;
    }

    if (!listing || !seller) {
      toast({
        title: "Fehler",
        description: "Das Inserat oder der Verkäufer konnte nicht gefunden werden.",
        variant: "destructive",
      });
      return;
    }

    setShowMessageDialog(true);
  };

  const sendMessage = async () => {
    if (!user || !messageContent.trim()) {
      toast({
        title: "Fehler",
        description: 'Bitte geben Sie eine Nachricht ein.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      // First check if conversation already exists
      const { data: existingConversation, error: existingError } = await supabase
        .from('conversations')
        .select()
        .eq('listing_id', listing?.id)
        .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${seller?.id}),and(participant1_id.eq.${seller?.id},participant2_id.eq.${user.id})`)
        .maybeSingle();

      if (existingError) throw existingError;
      
      let conversationId: string;
      
      if (existingConversation === null) {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            listing_id: listing?.id,
            participant1_id: user.id,
            participant2_id: seller?.id,
          })
          .select()
          .single();

        if (createError) throw createError;
        conversationId = newConversation.id;
      } else {
        conversationId = existingConversation?.id;
      }

      // Send the message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: messageContent.trim(),
        });

      if (messageError) throw messageError;

      toast({
        title: "Nachricht gesendet",
        description: 'Ihre Nachricht wurde erfolgreich gesendet.',
      });

      setShowMessageDialog(false);
      setMessageContent('');
      navigate('/messages');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fehler beim Senden",
        description: 'Die Nachricht konnte nicht gesendet werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Inserat nicht gefunden</h2>
        <p className="text-muted-foreground">
          Das gesuchte Inserat existiert nicht oder wurde entfernt.
        </p>
      </div>
    );
  }

  return (<>
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <Button
          variant="ghost"
          className="hover:bg-transparent hover:text-primary -ml-3"
          asChild
        >
          <Link to="/listings">← Zurück zur Übersicht</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <ImageCarousel
            images={listing.listing_images || []}
            className="rounded-lg overflow-hidden"
          />
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">{listing.category}</span>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {listing.condition === 'new' ? 'Neu' : 'Gebraucht'}
              </span>
              <span className="text-sm text-muted-foreground">•</span>
              <Link
                to={`/sellers/${listing.user_id}`}
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {seller?.avatar_url ? (
                    <img
                      src={seller.avatar_url}
                      alt={seller.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <span className="text-sm font-medium">
                  {seller?.username || 'Unbekannter Verkäufer'}
                </span>
              </Link>
            </div>
          </div>

          {/* Price Info */}
          <div className="bg-secondary/50 rounded-lg p-6 shadow-sm">
            <div className="text-2xl font-bold">
              {listing.price?.toLocaleString('de-DE', {
                style: 'currency',
                currency: 'CHF',
              })}
            </div>
            {isPending && (
              <div className="mt-2 text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-md">
                Dieses Inserat wird derzeit geprüft und kann nicht bearbeitet werden.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button 
              className="flex-1 gap-2"
              size="lg"
              onClick={handleMessage}
            >
              <MessageSquare className="h-5 w-5" />
              Nachricht senden
            </Button>

            <ShareDialog
              title={listing.title}
              description={listing.description || undefined}
              url={window.location.href}
            />

            <Button
              variant="outline"
              size="icon"
              className="w-12 h-12"
              onClick={() => setShowReportDialog(true)}
            >
              <AlertTriangle className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-12 h-12"
              onClick={(e) => {
                e.preventDefault();
                if (!favoriteLoading) toggleFavorite();
              }}
              disabled={favoriteLoading}
            >
              {isFavorite ? (
                <Heart className="h-5 w-5 text-red-500 fill-current" />
              ) : (
                <Heart className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Beschreibung</h2>
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

          {/* Meta Info */}
          <div className="pt-6 border-t space-y-1 text-sm text-muted-foreground">
            <p>
              Inseriert am{' '}
              {format(new Date(listing.created_at), 'PP', { locale: de })}
            </p>
            <p>{listing.view_count} Aufrufe</p>
          </div>
        </div>
      </div>
      
      {/* Message Dialog */}
      <AlertDialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nachricht senden</AlertDialogTitle>
            <AlertDialogDescription>
              Schreiben Sie eine Nachricht an den Verkäufer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-6">
            <Textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Ihre Nachricht..."
              className="w-full min-h-[120px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={sendMessage}
              disabled={isSending}
            >
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Senden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Report Dialog */}
      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        listingId={listing.id}
      />
    </div>

    {/* Auth Modal */}
    <AuthModal 
      open={showAuthModal} 
      onOpenChange={setShowAuthModal} 
      onSuccess={() => {
        setShowAuthModal(false);
        if (pendingAction === 'message') {
          handleMessage();
        } else if (pendingAction === 'favorite') {
          toggleFavorite();
        }
        setPendingAction(null);
      }} 
    />
  </>);
}