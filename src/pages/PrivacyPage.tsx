import { Lock } from 'lucide-react';

export function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Lock className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Datenschutzerklärung</h1>
        </div>

        <div className="prose prose-neutral max-w-none">
          <div className="bg-white p-8 rounded-lg shadow-sm border mb-8">
            <p className="text-sm text-muted-foreground mb-4">
              Stand: Januar 2025
            </p>
            <p className="text-muted-foreground">
              Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. In dieser Datenschutzerklärung informieren wir Sie über die Verarbeitung personenbezogener Daten bei der Nutzung von Swoppa.
            </p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Verantwortliche Stelle</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Verantwortlich für die Datenverarbeitung auf dieser Website ist:
                </p>
                <p>
                  Volk Solutions<br />
                  Nebelbachstrasse 3<br />
                  8008 Zürich<br />
                  Schweiz
                </p>
                <p>
                  E-Mail: contact@swoppa.ch<br />
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">2. Erhebung und Verarbeitung personenbezogener Daten</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  2.1. Bei der Registrierung erheben wir folgende Daten:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>E-Mail-Adresse</li>
                  <li>Benutzername</li>
                  <li>Passwort (verschlüsselt)</li>
                  <li>Name und Vorname</li>
                  <li>Standortdaten (optional)</li>
                </ul>
                <p>
                  2.2. Bei der Nutzung der Plattform werden zusätzlich folgende Daten verarbeitet:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>IP-Adresse</li>
                  <li>Datum und Uhrzeit der Anfrage</li>
                  <li>Browsertyp und -version</li>
                  <li>Betriebssystem</li>
                  <li>Besuchte Seiten</li>
                  <li>Herkunftsseite (Referrer)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">3. Zweck der Datenverarbeitung</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Wir verarbeiten Ihre personenbezogenen Daten für folgende Zwecke:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Bereitstellung und Verbesserung unserer Dienste</li>
                  <li>Kommunikation zwischen Nutzern</li>
                  <li>Betrugsprävention und Sicherheit</li>
                  <li>Erfüllung gesetzlicher Pflichten</li>
                  <li>Marketing (nur mit Ihrer Einwilligung)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">4. Rechtsgrundlagen</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Die Verarbeitung Ihrer Daten erfolgt auf folgenden Rechtsgrundlagen:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSG)</li>
                  <li>Gesetzliche Verpflichtungen (Art. 6 Abs. 1 lit. c DSG)</li>
                  <li>Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSG)</li>
                  <li>Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSG)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">5. Datenweitergabe</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  5.1. Eine Weitergabe Ihrer personenbezogenen Daten an Dritte erfolgt nur:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>An Dienstleister, die uns bei der Bereitstellung unserer Services unterstützen (z.B. Hosting-Provider)</li>
                  <li>Wenn Sie eingewilligt haben</li>
                  <li>Wenn wir gesetzlich dazu verpflichtet sind</li>
                </ul>
                <p>
                  5.2. Alle Dienstleister sind sorgfältig ausgewählt und vertraglich zur Einhaltung der datenschutzrechtlichen Bestimmungen verpflichtet.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">6. Datensicherheit</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  6.1. Wir treffen angemessene technische und organisatorische Sicherheitsmaßnahmen, um Ihre Daten vor Verlust, Manipulation und unberechtigtem Zugriff zu schützen.
                </p>
                <p>
                  6.2. Die Übertragung von Daten erfolgt verschlüsselt über HTTPS.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">7. Ihre Rechte</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Sie haben folgende Rechte:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Recht auf Auskunft über Ihre gespeicherten Daten</li>
                  <li>Recht auf Berichtigung unrichtiger Daten</li>
                  <li>Recht auf Löschung Ihrer Daten</li>
                  <li>Recht auf Einschränkung der Verarbeitung</li>
                  <li>Recht auf Datenübertragbarkeit</li>
                  <li>Widerspruchsrecht gegen die Verarbeitung</li>
                  <li>Recht auf Widerruf erteilter Einwilligungen</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">8. Cookies</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  8.1. Wir verwenden Cookies, um unsere Website benutzerfreundlicher zu gestalten. Einige Cookies bleiben auf Ihrem Gerät gespeichert, bis Sie diese löschen.
                </p>
                <p>
                  8.2. Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden und einzeln über deren Annahme entscheiden oder die Annahme von Cookies generell ausschließen.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">9. Änderungen dieser Datenschutzerklärung</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  9.1. Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf unter Beachtung der geltenden Datenschutzvorschriften anzupassen.
                </p>
                <p>
                  9.2. Die jeweils aktuelle Version der Datenschutzerklärung kann jederzeit auf dieser Seite eingesehen werden.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">10. Kontakt</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Bei Fragen zur Verarbeitung Ihrer personenbezogenen Daten können Sie sich jederzeit an uns wenden:
                </p>
                <p>
                  E-Mail: contact@swoppa.ch<br />
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}