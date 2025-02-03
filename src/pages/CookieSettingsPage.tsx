import { useState } from 'react';
import { Cookie, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

const cookieCategories = [
  {
    id: 'essential',
    name: 'Notwendige Cookies',
    description: 'Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.',
    required: true,
    cookies: [
      {
        name: 'session',
        purpose: 'Authentifizierung und Sitzungsverwaltung',
        duration: 'Sitzung',
      },
      {
        name: 'csrf',
        purpose: 'Sicherheit (CSRF-Schutz)',
        duration: 'Sitzung',
      },
    ],
  },
  {
    id: 'functional',
    name: 'Funktionale Cookies',
    description: 'Diese Cookies ermöglichen erweiterte Funktionen und Personalisierung.',
    cookies: [
      {
        name: 'preferences',
        purpose: 'Speichert Ihre Präferenzen und Einstellungen',
        duration: '1 Jahr',
      },
      {
        name: 'recently_viewed',
        purpose: 'Speichert kürzlich angesehene Artikel',
        duration: '30 Tage',
      },
    ],
  },
  {
    id: 'analytics',
    name: 'Analyse Cookies',
    description: 'Diese Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren.',
    cookies: [
      {
        name: 'analytics_id',
        purpose: 'Anonyme Nutzungsstatistiken',
        duration: '2 Jahre',
      },
      {
        name: 'page_views',
        purpose: 'Zählt Seitenaufrufe',
        duration: '1 Tag',
      },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing Cookies',
    description: 'Diese Cookies werden verwendet, um Werbung relevanter für Sie zu machen.',
    cookies: [
      {
        name: 'ad_id',
        purpose: 'Personalisierte Werbung',
        duration: '90 Tage',
      },
      {
        name: 'campaign_ref',
        purpose: 'Tracking von Marketing-Kampagnen',
        duration: '30 Tage',
      },
    ],
  },
];

export function CookieSettingsPage() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('cookie_preferences');
    return saved ? JSON.parse(saved) : {
      essential: true,
      functional: true,
      analytics: false,
      marketing: false,
    };
  });

  const handleToggle = (categoryId: string) => {
    if (categoryId === 'essential') return;
    
    setPreferences((prev: any) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleSave = () => {
    localStorage.setItem('cookie_preferences', JSON.stringify(preferences));
    toast({
      title: 'Einstellungen gespeichert',
      description: 'Ihre Cookie-Einstellungen wurden erfolgreich aktualisiert.',
    });
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem('cookie_preferences', JSON.stringify(allAccepted));
    toast({
      title: 'Alle Cookies akzeptiert',
      description: 'Sie haben allen Cookies zugestimmt.',
    });
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Cookie className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Cookie-Einstellungen</h1>
        </div>

        <div className="prose prose-neutral max-w-none">
          <div className="bg-white p-8 rounded-lg shadow-sm border mb-8">
            <div className="flex items-start gap-3 mb-4">
              <Shield className="h-5 w-5 mt-1 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">Ihre Privatsphäre ist uns wichtig</h2>
                <p className="text-muted-foreground">
                  Cookies helfen uns, Ihre Erfahrung auf unserer Website zu verbessern. Sie können hier Ihre Präferenzen verwalten.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button onClick={handleAcceptAll} className="flex-1">
                Alle akzeptieren
              </Button>
              <Button variant="outline" onClick={handleSave} className="flex-1">
                Auswahl speichern
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {cookieCategories.map((category) => (
              <div key={category.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                  <Switch
                    checked={preferences[category.id]}
                    onCheckedChange={() => handleToggle(category.id)}
                    disabled={category.required}
                  />
                </div>

                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Verwendete Cookies:</div>
                  <div className="grid gap-4">
                    {category.cookies.map((cookie) => (
                      <div key={cookie.name} className="text-sm">
                        <div className="font-medium">{cookie.name}</div>
                        <div className="text-muted-foreground">{cookie.purpose}</div>
                        <div className="text-muted-foreground">Dauer: {cookie.duration}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-sm text-muted-foreground">
            <p>
              Weitere Informationen über die Verwendung von Cookies finden Sie in unserer{' '}
              <a href="/privacy" className="text-primary hover:underline">
                Datenschutzerklärung
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}