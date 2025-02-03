import { Newspaper, Mail, Phone } from 'lucide-react';

export function PressPage() {
  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Newspaper className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Presseinformationen</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Willkommen im Pressebereich von Swoppa. Hier finden Sie aktuelle Informationen,
            Pressemitteilungen und Medienmaterial.
          </p>
        </div>

        {/* Press Kit */}
        <div className="bg-white p-8 rounded-lg shadow-sm border mb-12">
          <h2 className="text-2xl font-bold mb-6">Pressemappe</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              In unserer Pressemappe finden Sie:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Logos und Bildmaterial</li>
              <li>Unternehmensprofil</li>
              <li>Factsheet</li>
              <li>Biografien der Geschäftsleitung</li>
              <li>Hochauflösende Produktfotos</li>
            </ul>
            <p className="text-muted-foreground">
              Für Zugang zur Pressemappe kontaktieren Sie bitte unsere Pressestelle.
            </p>
          </div>
        </div>

        {/* Press Releases */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Pressemitteilungen</h2>
          <div className="bg-secondary/10 p-8 rounded-lg text-center">
            <p className="text-lg text-muted-foreground mb-4">
              Aktuell sind keine Pressemitteilungen verfügbar.
            </p>
            <p className="text-muted-foreground">
              Bleiben Sie informiert und abonnieren Sie unseren Presse-Newsletter.
            </p>
          </div>
        </div>

        {/* Press Contact */}
        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <h2 className="text-2xl font-bold mb-6">Pressekontakt</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground mb-6">
              Für Presseanfragen stehen wir Ihnen gerne zur Verfügung. Unser Presseteam
              beantwortet Ihre Fragen schnellstmöglich.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <a href="mailto:contact@swoppa.ch" className="text-primary hover:underline">
                  contact@swoppa.ch
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}