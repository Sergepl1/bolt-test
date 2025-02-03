import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { isEmailConfirmed, resendConfirmationEmail } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  showAuthModal?: () => void;
  requireEmailConfirmation?: boolean;
}

export function ProtectedRoute({ children, showAuthModal, requireEmailConfirmation = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [emailConfirmed, setEmailConfirmed] = useState<boolean>(false);
  const [checkingEmail, setCheckingEmail] = useState(true);
  
  const resendEmail = useCallback(async () => {
    if (!user?.email) return;
    
    try {
      await resendConfirmationEmail(user.email);
      toast({
        title: 'E-Mail gesendet',
        description: 'Eine neue Bestätigungs-E-Mail wurde gesendet.',
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Die E-Mail konnte nicht gesendet werden.',
        variant: 'destructive',
      });
    }
  }, [user?.email, toast]);

  useEffect(() => {
    if (!loading && !user && showAuthModal) {
      showAuthModal();
    }
  }, [user, loading, showAuthModal]);

  useEffect(() => {
    async function checkEmailStatus() {
      if (user) {
        const confirmed = await isEmailConfirmed();
        setEmailConfirmed(confirmed);
      }
      setCheckingEmail(false);
    }

    checkEmailStatus();
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (checkingEmail) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} />;
  }

  if (requireEmailConfirmation && !emailConfirmed) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border">
          <h2 className="text-2xl font-bold mb-4">E-Mail-Bestätigung erforderlich</h2>
          <p className="text-muted-foreground mb-6">
            Um diese Funktion nutzen zu können, bestätigen Sie bitte zuerst Ihre E-Mail-Adresse. 
            Wir haben Ihnen einen Bestätigungslink an {user?.email} gesendet.
          </p>
          <div className="space-y-4">
            <Button
              onClick={resendEmail}
              className="w-full"
            >
              Bestätigungs-E-Mail erneut senden
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Zurück zur Startseite
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}