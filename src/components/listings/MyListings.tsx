import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Edit, Eye, MoreVertical, Trash, Archive, Clock, CheckCircle2, XCircle, MessageCircle, Save } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { RatingDialog } from '@/components/ratings/RatingDialog';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';

type ListingWithStats = Tables['listings']['Row'] & {
  listing_images: Tables['listing_images']['Row'][];
  listing_views?: { count: number }[];
  listing_favorites?: { count: number }[];
  listing_messages?: { count: number }[];
};

const statusMap = {
  draft: { label: 'Entwurf', color: 'bg-blue-100 text-blue-700' },
  pending: { label: 'In Prüfung', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Freigegeben', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Abgelehnt', color: 'bg-red-100 text-red-700' },
  active: { label: 'Live', color: 'bg-green-100 text-green-700' },
  ended: { label: 'Beendet', color: 'bg-orange-100 text-orange-700' },
  sold: { label: 'Verkauft', color: 'bg-blue-100 text-blue-700' },
  inactive: { label: 'Archiviert', color: 'bg-gray-100 text-gray-700' },
} as const;

export function MyListings() {
  const [listings, setListings] = useState<ListingWithStats[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showPendingNotification, setShowPendingNotification] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [markAsSoldId, setMarkAsSoldId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchListings();
  }, []);

  async function fetchListings() {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser(); 
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('listings')
        .select(`
          *,
          listing_images (
            id,
            url,
            is_featured
          ),
          listing_favorites: listing_favorites!listing_id (count),
          conversations: conversations!listing_id (
            id,
            messages (count)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: 'Fehler beim Laden der Inserate',
        description: 'Bitte versuchen Sie es später erneut',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const deleteListing = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setListings((prev) => prev.filter((listing) => listing.id !== deleteId));
      toast({
        title: 'Inserat gelöscht',
        description: 'Das Inserat wurde erfolgreich gelöscht',
      });
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast({
        title: 'Fehler beim Löschen des Inserats',
        description: 'Bitte versuchen Sie es später erneut',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  const archiveListing = async () => {
    if (!archiveId) return;

    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: 'inactive' })
        .eq('id', archiveId);

      if (error) throw error;

      setListings((prev) =>
        prev.map((listing) =>
          listing.id === archiveId
            ? { ...listing, status: 'inactive' }
            : listing
        )
      );
      toast({
        title: 'Inserat archiviert',
        description: 'Das Inserat wurde erfolgreich archiviert',
      });
    } catch (error) {
      console.error('Error archiving listing:', error);
      toast({
        title: 'Fehler beim Archivieren des Inserats',
        description: 'Bitte versuchen Sie es später erneut',
        variant: 'destructive',
      });
    } finally {
      setArchiveId(null);
    }
  };

  const markAsSold = async () => {
    if (!markAsSoldId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update listing status to sold
      const { error: listingError } = await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', markAsSoldId);

      if (listingError) throw listingError;

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          listing_id: markAsSoldId,
          seller_id: user?.id || '00000000-0000-0000-0000-000000000000',
          buyer_id: '00000000-0000-0000-0000-000000000000', // Demo user
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      setListings((prev) =>
        prev.map((listing) =>
          listing.id === markAsSoldId
            ? { ...listing, status: 'sold' }
            : listing
        )
      );

      toast({
        title: 'Inserat als verkauft markiert',
        description: 'Das Inserat wurde erfolgreich als verkauft markiert.',
      });

      // Show rating dialog
      setSelectedTransaction(transaction);
      setShowRatingDialog(true);
    } catch (error) {
      console.error('Error marking listing as sold:', error);
      toast({
        title: 'Fehler',
        description: 'Das Inserat konnte nicht als verkauft markiert werden.',
        variant: 'destructive',
      });
    } finally {
      setMarkAsSoldId(null);
    }
  };

  const getTimeLeft = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Beendet';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const ListingCard = ({ listing }: { listing: ListingWithStats }) => (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
      <div className="flex gap-4">
        <Link
          to={`/listings/${listing.id}`}
          className="shrink-0 w-40 h-40 bg-muted rounded-md overflow-hidden"
        >
          {listing.listing_images?.[0] ? (
            <img
              src={listing.listing_images[0].url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Kein Bild
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div>
              <Link
                to={`/listings/${listing.id}`}
                className="text-lg font-semibold hover:underline"
              >
                {listing.title}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  {listing.category}
                </span>
                <Badge
                  variant="secondary"
                  className={`flex items-center gap-1 ${statusMap[listing.status].color}`}
                >
                  {listing.status === 'pending' && <Clock className="h-3 w-3" />}
                  {listing.status === 'draft' && <Save className="h-3 w-3" />}
                  {statusMap[listing.status].label}
                </Badge>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/listings/${listing.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ansehen
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to={`/listings/${listing.id}/edit`}
                    className={`${
                      listing.status === 'pending' ? 'pointer-events-none opacity-50' : 
                      listing.status === 'draft' ? 'text-primary' : ''
                    }`}
                    onClick={(e) => {
                      if (listing.status === 'pending') {
                        e.preventDefault();
                        toast({
                          title: 'Bearbeitung nicht möglich',
                          description: 'Das Inserat wird derzeit geprüft und kann nicht bearbeitet werden.',
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {listing.status === 'draft' ? 'Entwurf bearbeiten' : 'Bearbeiten'}
                  </Link>
                </DropdownMenuItem>
                {listing.status === 'active' && (
                  <DropdownMenuItem onSelect={() => setArchiveId(listing.id)}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archivieren
                  </DropdownMenuItem>
                )}
                {listing.status === 'active' && (
                  <DropdownMenuItem onSelect={() => setMarkAsSoldId(listing.id)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Als verkauft markieren
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  disabled={listing.status === 'pending'}
                  onSelect={() => setDeleteId(listing.id)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {listing.status === 'rejected' && listing.rejection_reason && (
            <div className="mt-2 p-4 bg-red-50 text-red-700 rounded-md">
              <strong>Ablehnungsgrund:</strong> {listing.rejection_reason}
            </div>
          )}

          {/* Price & Auction Info */}
          <div className="mt-2">
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
                  Startpreis:{' '}
                  {listing.auction_start_price?.toLocaleString('de-DE', {
                    style: 'currency',
                    currency: 'CHF',
                  })}
                </div>
                {listing.auction_end_time && (
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>
                      {listing.status === 'active'
                        ? getTimeLeft(listing.auction_end_time)
                        : format(new Date(listing.auction_end_time), 'PPp', {
                            locale: de,
                          })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{listing.view_count || 0} Aufrufe</span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span>{listing.listing_favorites?.[0]?.count || 0} Favoriten</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{listing.conversations?.reduce((total, conv) => total + (conv.messages?.[0]?.count || 0), 0) || 0} Anfragen</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Meine Inserate</h1>
          <p className="text-muted-foreground">
            {listings.length} Inserate insgesamt
          </p>
        </div>
        <Button asChild className="w-full md:w-auto">
          <Link to="/listings/new">Neues Inserat</Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="pending">In Prüfung</TabsTrigger>
          <TabsTrigger value="rejected">Abgelehnt</TabsTrigger>
          <TabsTrigger value="active">Aktiv</TabsTrigger>
          <TabsTrigger value="ended">Beendet</TabsTrigger>
          <TabsTrigger value="sold">Verkauft</TabsTrigger>
          <TabsTrigger value="archived">Archiviert</TabsTrigger>
        </TabsList>

        {['all', 'pending', 'rejected', 'active', 'ended', 'sold', 'archived'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {listings
                  .filter((listing) => {
                    if (tab === 'all') return true;
                    if (tab === 'archived') return listing.status === 'inactive';
                    return listing.status === tab;
                  }).map((listing) => {
                    if (!listing) return null; 
                    return (
                    <div key={listing.id}>
                      <ListingCard listing={listing} />
                      {listing.status === 'rejected' && listing.rejection_reason && (
                        <div className="mt-2 p-4 bg-red-50 text-red-700 rounded-md">
                          <strong>Ablehnungsgrund:</strong> {listing.rejection_reason}
                        </div>
                      )}
                    </div>
                    );
                  })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inserat löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Das Inserat wird
              dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteListing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Dialog */}
      <AlertDialog open={!!archiveId} onOpenChange={() => setArchiveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inserat archivieren?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Inserat wird deaktiviert und ist nicht mehr öffentlich sichtbar.
              Sie können es später wieder aktivieren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={archiveListing}>
              Archivieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as Sold Dialog */}
      <AlertDialog open={!!markAsSoldId} onOpenChange={() => setMarkAsSoldId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Als verkauft markieren?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie dieses Inserat als verkauft markieren? Dies ermöglicht es Ihnen und dem Käufer, sich gegenseitig zu bewerten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={markAsSold}>
              Als verkauft markieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rating Dialog */}
      {selectedTransaction && (
        <RatingDialog
          open={showRatingDialog}
          onOpenChange={setShowRatingDialog}
          transactionId={selectedTransaction.id}
          ratedUserId={selectedTransaction.buyer_id}
          onSuccess={() => {
            setShowRatingDialog(false);
            setSelectedTransaction(null);
          }}
        />
      )}
    </div>
  );
}