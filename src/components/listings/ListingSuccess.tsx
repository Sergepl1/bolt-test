import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, Copy, Facebook, Link as LinkIcon, Twitter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';

export function ListingSuccess() {
  const [listing, setListing] = useState<Tables['listings']['Row'] | null>(null);
  const [copied, setCopied] = useState(false);
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchListing() {
      if (!id) return;

      const { data, error } = await supabase
        .from('listings')
        .select('*')
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

  const shareUrl = `${window.location.origin}/listings/${id}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  };

  const shareOnTwitter = () => {
    const text = `Schau dir mein Inserat auf Swoppa an: ${listing?.title}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  };

  if (!listing) return null;

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-8">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Check className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Inserat veröffentlicht!</h1>
        <p className="text-muted-foreground">
          Dein Inserat ist jetzt online und kann von anderen Nutzern gefunden werden.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-secondary/50 rounded-lg p-4">
          <div className="font-medium mb-2">Teile dein Inserat</div>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="w-10 h-10"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={shareOnFacebook}
              className="w-10 h-10"
            >
              <Facebook className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={shareOnTwitter}
              className="w-10 h-10"
            >
              <Twitter className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              asChild
              className="w-10 h-10"
            >
              <Link to={`/listings/${id}`}>
                <LinkIcon className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link to={`/listings/${id}`}>
              Inserat ansehen
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/listings/my">
              Meine Inserate
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}