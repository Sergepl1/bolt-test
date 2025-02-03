import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, X, Loader2, AlertTriangle, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PendingListing {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  created_at: string;
  user_id: string;
  username: string;
  user_details: {
    username: string;
    full_name: string;
    email: string;
    phone: string;
    street: string;
    house_number: string;
    zip: string;
    city: string;
    canton: string;
    created_at: string;
  };
  images: Array<{
    url: string;
    is_featured: boolean;
  }>;
}

interface Report {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_status: string;
  reporter_id: string;
  reporter_username: string;
  reason: string;
  details: string;
  created_at: string;
}

export function AdminPage() {
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedListing, setSelectedListing] = useState<PendingListing | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('listings');

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        if (!user?.id) return;

        const { data, error } = await supabase
          .rpc('is_admin', {
            user_id: user.id
          });

        if (error) throw error;
        setIsAdmin(data);

        // If not admin, show error and redirect
        if (!data) {
          toast({
            title: 'Zugriff verweigert',
            description: 'Sie haben keine Berechtigung, auf diese Seite zuzugreifen.',
            variant: 'destructive',
          });
          navigate('/');
        } else {
          // Only fetch listings if user is admin
          if (activeTab === 'listings') {
            fetchPendingListings();
          } else {
            fetchReports();
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        toast({
          title: 'Fehler',
          description: 'Ihre Berechtigung konnte nicht überprüft werden.',
          variant: 'destructive',
        });
        navigate('/');
      }
    }

    checkAdminStatus();
  }, [user?.id, navigate, toast, activeTab]);

  async function fetchReports() {
    try {
      const { data, error } = await supabase.rpc('get_pending_reports');
      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Fehler beim Laden',
        description: 'Die Meldungen konnten nicht geladen werden.',
        variant: 'destructive',
      });
    }
  }

  async function fetchPendingListings() {
    try {
      const { data, error } = await supabase.rpc('get_pending_listings');
      if (error) throw error;
      setPendingListings(data || []);
      console.log('Pending listings:', data);
    } catch (error) {
      console.error('Error fetching pending listings:', error);
      toast({
        title: 'Fehler beim Laden',
        description: 'Die ausstehenden Inserate konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(listing: PendingListing) {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('approve_listing', {
        listing_id_param: listing.id
      });

      if (error) throw error;

      toast({
        title: 'Inserat freigegeben',
        description: 'Das Inserat wurde erfolgreich freigegeben.',
      });

      // Remove from list
      setPendingListings(prev => prev.filter(l => l.id !== listing.id));
    } catch (error) {
      console.error('Error approving listing:', error);
      toast({
        title: 'Fehler',
        description: 'Das Inserat konnte nicht freigegeben werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    if (!selectedListing || !rejectionReason.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('reject_listing', {
        listing_id_param: selectedListing.id,
        reason: rejectionReason.trim()
      });

      if (error) throw error;

      toast({
        title: 'Inserat abgelehnt',
        description: 'Das Inserat wurde erfolgreich abgelehnt.',
      });

      // Remove from list
      setPendingListings(prev => prev.filter(l => l.id !== selectedListing.id));
      setShowRejectDialog(false);
      setSelectedListing(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting listing:', error);
      toast({
        title: 'Fehler',
        description: 'Das Inserat konnte nicht abgelehnt werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResolveReport(reportId: string, status: 'resolved' | 'dismissed', notes?: string) {
    try {
      const { error } = await supabase.rpc('resolve_report', {
        report_id_param: reportId,
        new_status: status,
        notes: notes || null
      });

      if (error) throw error;

      toast({
        title: status === 'resolved' ? 'Meldung bearbeitet' : 'Meldung verworfen',
        description: 'Die Meldung wurde erfolgreich aktualisiert.',
      });

      // Remove from list
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (error) {
      console.error('Error resolving report:', error);
      toast({
        title: 'Fehler',
        description: 'Die Meldung konnte nicht aktualisiert werden.',
        variant: 'destructive',
      });
    }
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 pt-24">
        <div className="max-w-md mx-auto text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Zugriff verweigert</h1>
          <p className="text-muted-foreground mb-6">
            Sie haben keine Berechtigung, auf diese Seite zuzugreifen.
          </p>
          <Button onClick={() => navigate('/')}>
            Zurück zur Startseite
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 pt-24">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <Tabs defaultValue="listings" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="listings">
              Inserate
              {pendingListings.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {pendingListings.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports">
              Meldungen
              {reports.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {reports.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            {pendingListings.length === 0 ? (
              <div className="text-center py-12 bg-secondary/10 rounded-lg">
                <Check className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Keine ausstehenden Inserate
                </h2>
                <p className="text-muted-foreground">
                  Alle Inserate wurden bereits geprüft.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
            {pendingListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white p-6 rounded-lg shadow-sm border"
                id={`listing-${listing.id}`}
              >
                {/* Header with Actions */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <h2 className="text-xl font-semibold">{listing.title}</h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setSelectedListing(listing);
                        setShowRejectDialog(true);
                      }}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Ablehnen
                    </Button>
                    <Button
                      onClick={() => handleApprove(listing)}
                      disabled={isSubmitting}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Freigeben
                    </Button>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Inserat Details</h3>
                    <dl className="space-y-2">
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-muted-foreground">Kategorie:</dt>
                        <dd className="col-span-2">{listing.category}</dd>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-muted-foreground">Preis:</dt>
                        <dd className="col-span-2">
                          {listing.price?.toLocaleString('de-DE', {
                            style: 'currency',
                            currency: 'CHF',
                          })}
                        </dd>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-muted-foreground">Erstellt am:</dt>
                        <dd className="col-span-2">
                          {format(new Date(listing.created_at), 'PPp', { locale: de })}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Verkäufer Details</h3>
                    <dl className="space-y-2">
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-muted-foreground">Benutzername:</dt>
                        <dd className="col-span-2">
                          <Link 
                            to={`/sellers/${listing.user_id}`}
                            className="text-primary hover:underline"
                          >
                            {listing.user_details.username}
                          </Link>
                        </dd>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-muted-foreground">Name:</dt>
                        <dd className="col-span-2">{listing.user_details.full_name}</dd>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-muted-foreground">E-Mail:</dt>
                        <dd className="col-span-2">
                          <a 
                            href={`mailto:${listing.user_details.email}`}
                            className="text-primary hover:underline"
                          >
                            {listing.user_details.email}
                          </a>
                        </dd>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-muted-foreground">Telefon:</dt>
                        <dd className="col-span-2">
                          {listing.user_details.phone || '-'}
                        </dd>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-muted-foreground">Adresse:</dt>
                        <dd className="col-span-2">
                          {[
                            listing.user_details.street,
                            listing.user_details.house_number,
                            `${listing.user_details.zip} ${listing.user_details.city}`,
                            listing.user_details.canton
                          ].filter(Boolean).join(', ')}
                        </dd>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-muted-foreground">Mitglied seit:</dt>
                        <dd className="col-span-2">
                          {format(new Date(listing.user_details.created_at), 'PP', { locale: de })}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4">Beschreibung</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {listing.description}
                  </p>
                </div>

                {/* Images */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Bilder</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {listing.images?.map((image, index) => (
                      <div 
                        key={index}
                        className="relative aspect-square bg-muted rounded-lg overflow-hidden"
                      >
                        <img
                          src={image.url}
                          alt={`Bild ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {image.is_featured && (
                          <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                            Titelbild
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
            )}
          </TabsContent>

          <TabsContent value="reports">
            {reports.length === 0 ? (
              <div className="text-center py-12 bg-secondary/10 rounded-lg">
                <Check className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Keine ausstehenden Meldungen
                </h2>
                <p className="text-muted-foreground">
                  Alle Meldungen wurden bereits bearbeitet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white p-6 rounded-lg shadow-sm border"
                  >
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Flag className="h-4 w-4 text-destructive" />
                          <span className="font-medium">
                            Meldung von {report.reporter_username}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            • {format(new Date(report.created_at), 'PPp', { locale: de })}
                          </span>
                        </div>
                        <Link
                          to={`/listings/${report.listing_id}`}
                          className="text-xl font-semibold hover:text-primary transition-colors"
                        >
                          {report.listing_title}
                        </Link>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleResolveReport(report.id, 'dismissed')}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Verwerfen
                        </Button>
                        <Button
                          onClick={() => handleResolveReport(report.id, 'resolved')}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Bearbeitet
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Grund</h3>
                        <p className="font-medium">{report.reason}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Details</h3>
                        <p className="whitespace-pre-wrap">{report.details}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserat ablehnen</DialogTitle>
            <DialogDescription>
              Bitte geben Sie einen Grund für die Ablehnung an. Der Verkäufer wird per E-Mail benachrichtigt.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Grund für die Ablehnung..."
            className="min-h-[100px]"
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setSelectedListing(null);
                setRejectionReason('');
              }}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ablehnen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}