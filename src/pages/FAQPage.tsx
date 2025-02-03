import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const faqs = [
  {
    category: 'Allgemein',
    questions: [
      {
        question: 'Was ist Swoppa?',
        answer: 'Swoppa ist ein lokaler Marktplatz, auf dem du gebrauchte und neue Artikel kaufen, verkaufen, tauschen oder verschenken kannst. Wir legen besonderen Wert auf Nachhaltigkeit und fördern den lokalen Handel.',
      },
      {
        question: 'Ist die Nutzung von Swoppa kostenlos?',
        answer: 'Ja, die grundlegende Nutzung von Swoppa ist komplett kostenlos. Du kannst kostenlos Inserate erstellen, mit anderen Nutzern kommunizieren und Artikel kaufen.',
      },
      {
        question: 'Wie registriere ich mich?',
        answer: 'Die Registrierung ist einfach: Klicke oben rechts auf "Anmelden" und wähle dann "Registrieren". Gib deine E-Mail-Adresse, ein sicheres Passwort und deinen Benutzernamen ein. Nach der Bestätigung deiner E-Mail-Adresse kannst du sofort loslegen.',
      },
    ],
  },
  {
    category: 'Kaufen & Verkaufen',
    questions: [
      {
        question: 'Wie erstelle ich ein Inserat?',
        answer: 'Klicke auf "Inserieren" in der Navigation. Fülle das Formular mit Titel, Beschreibung, Preis und Fotos aus. Wähle die passende Kategorie und gib deinen Standort an. Nach der Vorschau kannst du das Inserat veröffentlichen.',
      },
      {
        question: 'Welche Zahlungsmethoden werden unterstützt?',
        answer: 'Wir unterstützen verschiedene sichere Zahlungsmethoden: Überweisung, PayPal und Barzahlung bei persönlicher Übergabe. Die verfügbaren Optionen werden beim jeweiligen Inserat angezeigt.',
      },
      {
        question: 'Was kostet der Versand?',
        answer: 'Die Versandkosten werden vom Verkäufer festgelegt und sind im Inserat angegeben. Bei lokalen Deals ist auch eine persönliche Übergabe ohne Versandkosten möglich.',
      },
    ],
  },
  {
    category: 'Sicherheit',
    questions: [
      {
        question: 'Wie schützt Swoppa meine persönlichen Daten?',
        answer: 'Deine Daten werden nach höchsten Sicherheitsstandards verschlüsselt gespeichert. Wir geben keine persönlichen Informationen an Dritte weiter und zeigen anderen Nutzern nur die Informationen, die für den Handel notwendig sind.',
      },
      {
        question: 'Was tun bei Problemen mit einem Kauf?',
        answer: 'Bei Problemen kontaktiere zuerst den Verkäufer über unsere Nachrichtenfunktion. Sollte keine Einigung möglich sein, steht unser Support-Team bereit. Bei Zahlungen über unsere Plattform greift außerdem unser Käuferschutz.',
      },
      {
        question: 'Gibt es einen Käuferschutz?',
        answer: 'Ja, bei Zahlungen über unsere Plattform bieten wir einen umfassenden Käuferschutz. Dieser greift bei nicht erhaltener Ware oder wenn der Artikel erheblich von der Beschreibung abweicht.',
      },
    ],
  },
  {
    category: 'Tauschen & Verschenken',
    questions: [
      {
        question: 'Wie funktioniert das Tauschen?',
        answer: 'Bei Inseraten mit aktivierter Tauschoption kannst du dem Verkäufer ein Tauschangebot machen. Beschreibe deinen Tauschartikel und füge Fotos hinzu. Wenn beide Seiten einverstanden sind, kann der Tausch stattfinden.',
      },
      {
        question: 'Kann ich Artikel auch verschenken?',
        answer: 'Ja, du kannst Artikel auch kostenlos anbieten. Wähle dafür beim Erstellen des Inserats einfach "Zu verschenken" als Option aus. Dies ist eine tolle Möglichkeit, nicht mehr benötigten Dingen ein zweites Leben zu geben.',
      },
    ],
  },
];

export function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-bold mb-4">Häufig gestellte Fragen</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Finde schnell Antworten auf deine Fragen. Falls du weitere Hilfe brauchst,
          kontaktiere unseren Support.
        </p>
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suche in den FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="max-w-3xl mx-auto space-y-8">
        {filteredFaqs.map((category, index) => (
          <div key={index}>
            <h2 className="text-2xl font-semibold mb-4">{category.category}</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {category.questions.map((faq, faqIndex) => (
                <AccordionItem key={faqIndex} value={`${index}-${faqIndex}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
        {filteredFaqs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Keine Ergebnisse für "{searchTerm}" gefunden.
          </div>
        )}
      </div>

      {/* Contact Section */}
      <div className="text-center mt-16">
        <p className="text-muted-foreground">
          Keine Antwort gefunden? Unser Support-Team hilft dir gerne weiter.
        </p>
        <a
          href="mailto:support@swoppa.ch"
          className="text-primary hover:underline"
        >
          support@swoppa.ch
        </a>
      </div>
    </div>
  );
}