import { Shield } from 'lucide-react';

export function TermsPage() {
  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Allgemeine Geschäftsbedingungen</h1>
        </div>

        <div className="prose prose-neutral max-w-none">
          <div className="bg-white p-8 rounded-lg shadow-sm border mb-8">
            <p className="text-sm text-muted-foreground mb-4">
              Stand: Januar 2025
            </p>
            <p className="text-muted-foreground">
              Die nachfolgenden Geschäftsbedingungen regeln das Vertragsverhältnis zwischen den Nutzern der Plattform Swoppa und der Volk Solutions (nachfolgend "Swoppa" genannt).
            </p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Geltungsbereich</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  1.1. Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für sämtliche Dienstleistungen und Angebote, die Swoppa auf der Plattform www.swoppa.ch zur Verfügung stellt.
                </p>
                <p>
                  1.2. Mit der Nutzung der Plattform akzeptiert der Nutzer diese AGB in der jeweils gültigen Fassung.
                </p>
                <p>
                  1.3. Swoppa behält sich das Recht vor, diese AGB jederzeit zu ändern. Änderungen werden den Nutzern mindestens 14 Tage vor Inkrafttreten in geeigneter Weise mitgeteilt, beispielsweise per E-Mail oder durch einen Hinweis auf der Plattform. Mit der weiteren Nutzung der Plattform nach Inkrafttreten gelten die Änderungen als akzeptiert.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">2. Leistungsbeschreibung</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  2.1. Swoppa stellt eine Online-Plattform zur Verfügung, auf der Nutzer Waren zum Kauf, Verkauf, Tausch oder zur kostenlosen Abgabe anbieten können.
                </p>
                <p>
                  2.2. Swoppa tritt dabei ausschließlich als Vermittler auf. Verträge über den Kauf, Verkauf oder Tausch von Waren kommen ausschließlich zwischen den Nutzern zustande.
                </p>
                <p>
                  2.3. Die Nutzung der grundlegenden Funktionen der Plattform ist kostenlos. Swoppa behält sich jedoch das Recht vor, kostenpflichtige Zusatzfunktionen wie Inserat-Boosts oder Premium-Dienste anzubieten. Diese sind freiwillig und werden klar gekennzeichnet.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">3. Registrierung und Nutzerkonto</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  3.1. Für die Nutzung der Plattform ist eine Registrierung erforderlich. Der Nutzer ist verpflichtet, wahrheitsgemäße Angaben zu machen.
                </p>
                <p>
                  3.2. Das Nutzerkonto ist nicht übertragbar. Der Nutzer ist für die sichere Aufbewahrung seiner Zugangsdaten verantwortlich.
                </p>
                <p>
                  3.3. Swoppa behält sich das Recht vor, Nutzerkonten bei Verstößen gegen diese AGB, geltendes Recht oder die Richtlinien der Plattform zu sperren oder zu löschen.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">4. Inserate und Transaktionen</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  4.1. Swoppa ist eine reine Vermittlungsplattform. Alle Transaktionen, einschließlich Zahlungen, Übergabe der Waren und sonstiger Vereinbarungen, werden direkt zwischen den Nutzern abgewickelt. Swoppa bietet keine Mediation zwischen den Nutzern an, empfiehlt jedoch Schritte zur Konfliktlösung, wie in den Sicherheitsrichtlinien beschrieben.
                </p>
                <p>
                  4.2. Der Nutzer verpflichtet sich, in seinen Inseraten nur Waren anzubieten, deren Verkauf nach schweizerischem Recht zulässig ist. Es ist verboten, Artikel oder Inhalte anzubieten, die gegen geltendes Recht, ethische Standards oder die Richtlinien der Plattform verstoßen, wie z. B. illegale Waren, gefährliche Güter oder gefälschte Produkte.
                </p>
                <p>
                  4.3. Die Beschreibung der Waren muss wahrheitsgemäß und vollständig sein. Der Nutzer haftet für die Richtigkeit seiner Angaben.
                </p>
                <p>
                  4.4. Swoppa behält sich das Recht vor, Inserate zu löschen, die gegen die AGB, geltendes Recht oder die Richtlinien der Plattform verstoßen.
                </p>
                <p>
                  4.5. Die Nutzer sind selbst dafür verantwortlich, alle notwendigen Vorkehrungen für eine sichere Transaktion zu treffen.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">5. Zahlungsabwicklung</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  5.1. Swoppa bietet keine eigenen Zahlungsdienste an. Die Zahlungsabwicklung erfolgt ausschließlich direkt zwischen den Nutzern.
                </p>
                <p>
                  5.2. Die Nutzer wählen eigenständig eine Zahlungsmethode und tragen die Verantwortung dafür, eine sichere und geeignete Methode zu nutzen.
                </p>
                <p>
                  5.3. Swoppa übernimmt keine Haftung für Zahlungen oder damit verbundene Probleme zwischen den Nutzern.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">6. Sicherheitshinweise</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  6.1. Verdächtige Aktivitäten oder betrügerische Inserate sind unverzüglich an Swoppa zu melden.
                </p>
                <p>
                  6.2. Swoppa kann keine Garantie für die Sicherheit der Transaktionen zwischen Nutzern übernehmen.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">7. Haftung</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  7.1. Als reine Vermittlungsplattform haftet Swoppa nicht für:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Schäden aus Transaktionen zwischen Nutzern</li>
                  <li>Die Bonität oder Zuverlässigkeit der Nutzer</li>
                  <li>Die Qualität, Sicherheit oder Legalität der angebotenen Artikel</li>
                  <li>Die Durchführung von Zahlungen zwischen Nutzern</li>
                  <li>Verluste durch betrügerische Aktivitäten anderer Nutzer</li>
                </ul>
                <p>
                  7.2. Die Haftung von Swoppa beschränkt sich auf Vorsatz und grobe Fahrlässigkeit.
                </p>
                <p>
                  7.3. Für die Verfügbarkeit der Plattform wird keine Gewähr übernommen.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">8. Datenschutz</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  8.1. Die Erhebung und Verarbeitung personenbezogener Daten erfolgt gemäß der Datenschutzerklärung und den geltenden Datenschutzbestimmungen.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">9. Schlussbestimmungen</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  9.1. Es gilt schweizerisches Recht unter Ausschluss des UN-Kaufrechts.
                </p>
                <p>
                  9.2. Gerichtsstand ist Zürich, soweit nicht zwingende gesetzliche Bestimmungen einen anderen Gerichtsstand vorsehen.
                </p>
                <p>
                  9.3. Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}