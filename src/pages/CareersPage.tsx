import { Briefcase, Heart, Users, Zap, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const benefits = [
  {
    icon: Heart,
    title: 'Work-Life-Balance',
    description: 'Flexible Arbeitszeiten, Home-Office-Möglichkeiten und 25 Tage Urlaub',
  },
  {
    icon: Users,
    title: 'Starkes Team',
    description: 'Arbeite mit talentierten Menschen in einem diversen, internationalen Umfeld',
  },
  {
    icon: Zap,
    title: 'Innovation',
    description: 'Modernste Technologien und die Freiheit, neue Ideen umzusetzen',
  },
];

const values = [
  {
    title: 'Nachhaltigkeit',
    description: 'Wir setzen uns für eine nachhaltige Zukunft ein und fördern die Sharing Economy.',
  },
  {
    title: 'Transparenz',
    description: 'Offene Kommunikation und flache Hierarchien prägen unsere Kultur.',
  },
  {
    title: 'Innovation',
    description: 'Wir denken neu und gestalten die Zukunft des lokalen Handels.',
  },
  {
    title: 'Teamwork',
    description: 'Gemeinsam erreichen wir unsere Ziele und unterstützen uns gegenseitig.',
  },
];

export function CareersPage() {
  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-24">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <Briefcase className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-6">
          Gestalte mit uns die Zukunft des lokalen Handels
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Bei Swoppa arbeiten wir gemeinsam daran, den lokalen Handel nachhaltiger und
          effizienter zu gestalten. Werde Teil unseres Teams und hilf uns dabei,
          diese Vision Wirklichkeit werden zu lassen.
        </p>
        <Button size="lg" asChild>
          <a href="#positions">Offene Stellen ansehen</a>
        </Button>
      </div>

      {/* Benefits Section */}
      <div className="mb-24">
        <h2 className="text-3xl font-bold text-center mb-12">Deine Vorteile</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-lg shadow-sm border text-center hover:shadow-md transition-shadow"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <benefit.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-secondary/10 py-24 -mx-4 px-4 mb-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Unsere Werte</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div id="positions" className="mb-24">
        <h2 className="text-3xl font-bold text-center mb-12">Offene Stellen</h2>
        <div className="max-w-3xl mx-auto">
          <div className="bg-secondary/10 p-8 rounded-lg text-center">
            <p className="text-lg text-muted-foreground mb-4">
              Zur Zeit haben wir leider keine offenen Stellen.
            </p>
            <p className="text-muted-foreground">
              Schauen Sie später wieder vorbei oder senden Sie uns eine Initiativbewerbung.
            </p>
          </div>
        </div>
      </div>

      {/* Initiative Application */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <h2 className="text-2xl font-bold mb-6">Initiativbewerbung</h2>
          <p className="text-muted-foreground mb-8">
            Keine passende Stelle gefunden? Wir sind immer auf der Suche nach talentierten
            Menschen, die unser Team verstärken möchten. Sende uns deine Initiativbewerbung!
          </p>
          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input placeholder="Ihr vollständiger Name" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">E-Mail</label>
                <Input type="email" placeholder="ihre.email@beispiel.ch" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Gewünschter Bereich</label>
              <Input placeholder="z.B. Engineering, Design, Marketing" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Nachricht</label>
              <Textarea
                placeholder="Erzählen Sie uns von sich und Ihrer Motivation"
                className="min-h-[150px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Lebenslauf</label>
              <Input type="file" accept=".pdf,.doc,.docx" />
            </div>
            <Button type="submit" className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Bewerbung absenden
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}