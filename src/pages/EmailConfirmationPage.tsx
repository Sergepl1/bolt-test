import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export function EmailConfirmationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) throw error;

        setIsSuccess(true);
        toast({
          title: 'E-Mail bestätigt',
          description: 'Ihre E-Mail-Adresse wurde erfolgreich bestätigt.',
        });
      } catch (error) {
        console.error('Error confirming email:', error);
        setIsSuccess(false);
        toast({
          title: 'Fehler bei der Bestätigung',
          description: 'Ihre E-Mail-Adresse konnte nicht bestätigt werden.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    handleEmailConfirmation();
  }, [toast]);

  return (
    <div className="container mx-auto px-4 pt-24">
      <div className="max-w-md mx-auto text-center">
        {isLoading ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">
              E-Mail wird bestätigt
            </h1>
            <p className="text-muted-foreground">
              Bitte warten Sie einen Moment...
            </p>
          </div>
        ) : isSuccess ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">
              E-Mail erfolgreich bestätigt
            </h1>
            <p className="text-muted-foreground mb-6">
              Ihre E-Mail-Adresse wurde erfolgreich bestätigt. Sie können nun alle Funktionen von Swoppa nutzen.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Zur Startseite
            </Button>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">
              Bestätigung fehlgeschlagen
            </h1>
            <p className="text-muted-foreground mb-6">
              Leider ist bei der Bestätigung Ihrer E-Mail-Adresse ein Fehler aufgetreten. 
              Bitte versuchen Sie es erneut oder kontaktieren Sie unseren Support.
            </p>
            <div className="space-y-4">
              <Button onClick={() => window.location.reload()} className="w-full">
                Erneut versuchen
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                Zur Startseite
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}