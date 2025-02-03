import { Building2, Mail, MapPin, Phone } from 'lucide-react';

export function ImprintPage() {
  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Impressum</h1>

        {/* Company Information */}
        <div className="bg-white p-8 rounded-lg shadow-sm border mb-8">
          <div className="flex items-start gap-3 mb-6">
            <Building2 className="h-5 w-5 mt-1 text-primary" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Volk Solutions</h2>
              <p className="text-muted-foreground">Nebelbachstrasse 3</p>
              <p className="text-muted-foreground">8008 Zürich</p>
              <p className="text-muted-foreground">Schweiz</p>
            </div>
          </div>

          <div className="flex items-start gap-3 mb-6">
            <Mail className="h-5 w-5 mt-1 text-primary" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Kontakt</h2>
              <p className="text-muted-foreground">E-Mail: contact@volk-solutions.com</p>
            </div>
          </div>
        </div>

        {/* Legal Information */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Haftungsausschluss</h2>
            <p className="text-muted-foreground">
              Der Autor übernimmt keinerlei Gewähr hinsichtlich der inhaltlichen Richtigkeit, Genauigkeit, Aktualität, Zuverlässigkeit und Vollständigkeit der Informationen. Haftungsansprüche gegen den Autor wegen Schäden materieller oder immaterieller Art, welche aus dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten Informationen entstanden sind, werden ausgeschlossen.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Urheberrechte</h2>
            <p className="text-muted-foreground">
              Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos oder anderen Dateien auf der Website gehören ausschliesslich Volk Solutions oder den speziell genannten Rechtsinhabern. Für die Reproduktion jeglicher Elemente ist die schriftliche Zustimmung der Urheberrechtsträger im Voraus einzuholen.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Datenschutz</h2>
            <p className="text-muted-foreground">
              Gestützt auf Artikel 13 der schweizerischen Bundesverfassung und die datenschutzrechtlichen Bestimmungen des Bundes (Datenschutzgesetz, DSG) hat jede Person Anspruch auf Schutz ihrer Privatsphäre sowie auf Schutz vor Missbrauch ihrer persönlichen Daten. Wir halten diese Bestimmungen ein. Persönliche Daten werden streng vertraulich behandelt und weder an Dritte verkauft noch weitergegeben.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Änderungen</h2>
            <p className="text-muted-foreground">
              Wir behalten uns das Recht vor, jederzeit ohne vorherige Ankündigung Änderungen an unserem Internetauftritt vorzunehmen. Alle Angaben sind ohne Gewähr.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}