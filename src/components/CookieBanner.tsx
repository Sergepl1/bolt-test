import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CookieSettings {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const defaultSettings: CookieSettings = {
  essential: true, // Always true, can't be disabled
  functional: false,
  analytics: false,
  marketing: false,
};

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [settings, setSettings] = useState<CookieSettings>(defaultSettings);

  useEffect(() => {
    // Check if user has already made a choice
    const cookieChoice = localStorage.getItem('cookie-consent');
    if (!cookieChoice) {
      setOpen(true);
    } else {
      setSettings(JSON.parse(cookieChoice));
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    localStorage.setItem('cookie-consent', JSON.stringify(allAccepted));
    setSettings(allAccepted);
    setOpen(false);
  };

  const handleAcceptSelected = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(settings));
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-white border-t shadow-lg">
      <div className="container mx-auto p-4 space-y-4">
        {showDetails ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Cookie-Einstellungen</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDetails(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Notwendige Cookies</h3>
                    <p className="text-sm text-muted-foreground">
                      Diese Cookies sind für die Grundfunktionen der Website erforderlich.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.essential}
                    disabled
                    className="h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Funktionale Cookies</h3>
                    <p className="text-sm text-muted-foreground">
                      Ermöglichen erweiterte Funktionen und Personalisierung.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.functional}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        functional: e.target.checked,
                      }))
                    }
                    className="h-4 w-4"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Analyse Cookies</h3>
                    <p className="text-sm text-muted-foreground">
                      Helfen uns zu verstehen, wie Besucher mit der Website interagieren.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.analytics}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        analytics: e.target.checked,
                      }))
                    }
                    className="h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Marketing Cookies</h3>
                    <p className="text-sm text-muted-foreground">
                      Werden verwendet, um Werbung relevanter für Sie zu machen.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.marketing}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        marketing: e.target.checked,
                      }))
                    }
                    className="h-4 w-4"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={handleAcceptSelected}>
                Auswahl speichern
              </Button>
              <Button onClick={handleAcceptAll}>
                Alle akzeptieren
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <Cookie className="h-5 w-5 text-primary mt-1" />
              <div className="space-y-1">
                <p className="text-sm">
                  Wir verwenden Cookies, um Ihre Erfahrung auf unserer Website zu verbessern.{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => setShowDetails(true)}
                  >
                    Cookie-Einstellungen anpassen
                  </Button>
                </p>
                <p className="text-xs text-muted-foreground">
                  Weitere Informationen finden Sie in unserer{' '}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Datenschutzerklärung
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <Button
                variant="outline"
                onClick={handleAcceptSelected}
                className="flex-1 md:flex-none"
              >
                Nur Notwendige
              </Button>
              <Button
                onClick={handleAcceptAll}
                className="flex-1 md:flex-none"
              >
                Alle akzeptieren
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}