import { useState } from 'react';
import { Check, Copy, Facebook, Link, Mail, Share, Twitter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface ShareDialogProps {
  title: string;
  description?: string;
  url: string;
}

export function ShareDialog({ title, description, url }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Link kopiert',
        description: 'Der Link wurde in die Zwischenablage kopiert',
      });
    } catch (error) {
      toast({
        title: 'Fehler beim Kopieren',
        description: 'Der Link konnte nicht kopiert werden',
        variant: 'destructive',
      });
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${description}\n\n${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setOpen(false);
  };

  const shareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank',
      'width=600,height=400'
    );
    setOpen(false);
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`${title}\n${url}`);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}`,
      '_blank',
      'width=600,height=400'
    );
    setOpen(false);
  };

  const handleNativeShare = async () => {
    try {
      // Check if Web Share API is supported
      if (!navigator.share) {
        throw new Error('Web Share API not supported');
      }

      // Try to share
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
        setOpen(false);
      } catch (error) {
        // Ignore user cancellations
        if (error instanceof Error && error.message.includes('Share canceled')) {
          return;
        }
        throw error;
      }
    } catch (error) {
      // Fallback to copying to clipboard
      await copyToClipboard();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="w-12 h-12"
        >
          <Share className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inserat teilen</DialogTitle>
          <DialogDescription>
            Teile dieses Inserat mit anderen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Link Sharing */}
          <div className="flex gap-2">
            <Input
              value={url}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={shareViaEmail}
            >
              <Mail className="mr-2 h-4 w-4" />
              Per E-Mail
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={shareOnFacebook}
            >
              <Facebook className="mr-2 h-4 w-4" />
              Facebook
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={shareOnTwitter}
            >
              <Twitter className="mr-2 h-4 w-4" />
              Twitter
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleNativeShare}
            >
              <Link className="mr-2 h-4 w-4" />
              Mehr Optionen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}