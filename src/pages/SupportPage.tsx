import { HelpCircle, MessageCircle, Clock, PhoneCall, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const supportCategories = [
  {
    icon: MessageCircle,
    title: 'Kontakt & Support',
    description: 'Unser Support-Team hilft Ihnen bei allen Fragen zur Plattform. Antwort innerhalb von 24h.',
    action: 'Kontakt aufnehmen',
    href: '/contact'
  },
  {
    icon: PhoneCall,
    title: 'Technische Unterstützung',
    description: 'Hilfe bei technischen Problemen mit der Website oder Ihrem Account.',
    action: 'Mehr erfahren',
    href: '/faq#technical'
  },
  {
    icon: HelpCircle,
    title: 'Sicherheit & Vertrauen',
    description: 'Tipps für sicheres Handeln und Informationen zum Schutz vor Betrug.',
    action: 'Sicherheitshinweise',
    href: '/security'
  },
];

const faqHighlights = [
  {
    question: 'Was tun bei Problemen mit einem Verkäufer?',
    answer: 'Kontaktieren Sie zuerst den Verkäufer über unsere Plattform. Bei anhaltenden Problemen steht unser Support-Team bereit.',
  },
  {
    question: 'Wie kann ich ein Inserat melden?',
    answer: 'Nutzen Sie den "Melden"-Button beim Inserat oder kontaktieren Sie unseren Support mit dem Link zum Inserat.',
  },
];

export function SupportPage() {
  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Wie können wir helfen?</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unser Support-Team steht Ihnen bei allen Fragen zur Seite.
            Wählen Sie eine Kategorie oder kontaktieren Sie uns direkt.
          </p>
        </div>

        {/* Quick Search */}
        <div className="bg-white p-8 rounded-lg shadow-sm border mb-16">
          <h2 className="text-xl font-semibold mb-4">Schnellsuche</h2>
          <div className="relative">
            <Input
              placeholder="Wonach suchen Sie?"
              className="pl-10"
            />
            <HelpCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Support Categories */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {supportCategories.map((category, index) => (
            <a
              href={category.href}
              key={index}
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <category.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{category.title}</h3>
              <p className="text-muted-foreground mb-4">{category.description}</p>
              <span className="text-primary font-medium group-hover:underline inline-flex items-center">
                {category.action} <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </a>
          ))}
        </div>

        {/* FAQ Highlights */}
        <div className="bg-secondary/10 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-8">Häufig gestellte Fragen</h2>
          <div className="space-y-6">
            {faqHighlights.map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild>
              <a href="/faq">Alle FAQs ansehen</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}