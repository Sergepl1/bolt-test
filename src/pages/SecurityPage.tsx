import { Shield, Lock, UserCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const securityFeatures = [
  {
    icon: Lock,
    title: 'Sichere Plattform',
    description: 'Unsere Plattform bietet eine sichere Umgebung für die Kommunikation zwischen Nutzern. Die Kontaktaufnahme erfolgt ausschließlich über unser integriertes Nachrichtensystem.',
  },
  {
    icon: UserCheck,
    title: 'Verifizierte Nutzer',
    description: 'Wir setzen auf ein Bewertungssystem und Nutzerfeedback, um Vertrauen in der Community aufzubauen und die Zuverlässigkeit der Nutzer transparent zu machen.',
  },
  {
    icon: Shield,
    title: 'Datenschutz',
    description: 'Ihre persönlichen Daten und Kommunikation werden nach höchsten Sicherheitsstandards verschlüsselt und geschützt.',
  },
  {
    icon: AlertTriangle,
    title: 'Betrugsschutz',
    description: 'Unser Team überwacht die Plattform aktiv und geht gegen verdächtige Aktivitäten vor. Nutzer können verdächtige Inserate und Verhaltensweisen melden.',
  },
];

const guidelines = [
  {
    title: 'Sichere Kommunikation',
    items: [
      'Kommunizieren Sie ausschließlich über die Swoppa-Plattform',
      'Tauschen Sie sensible Informationen erst nach sorgfältiger Prüfung aus',
      'Seien Sie vorsichtig bei externen Links',
      'Melden Sie verdächtige Nachrichten',
    ],
  },
  {
    title: 'Sichere Transaktionen',
    items: [
      'Treffen Sie sich an sicheren, öffentlichen Orten zur Übergabe',
      'Prüfen Sie die Ware vor der Bezahlung',
      'Vereinbaren Sie Zahlungsmodalitäten direkt mit dem Handelspartner',
      'Dokumentieren Sie den Zustand der Ware',
      'Bewahren Sie Belege und Kommunikationsverlauf auf',
    ],
  },
];

const reportingSteps = [
  {
    title: 'Verdächtiges Verhalten melden',
    description: 'Nutzen Sie die Melden-Funktion bei verdächtigen Inseraten oder Nachrichten.',
  },
  {
    title: 'Support kontaktieren',
    description: 'Unser Support-Team ist 7 Tage die Woche für Sie erreichbar.',
  },
  {
    title: 'Beweise sichern',
    description: 'Speichern Sie Screenshots und relevante Kommunikation.',
  },
];

export function SecurityPage() {
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Check if we're in development
    if (import.meta.env.DEV) {
      console.log('Form submitted in development:', {
        name: (event.target as HTMLFormElement).name.value,
        email: (event.target as HTMLFormElement).email.value,
        subject: (event.target as HTMLFormElement).subject.value,
        message: (event.target as HTMLFormElement).message.value,
      });
      toast({
        title: 'Entwicklungsmodus',
        description: 'Das Formular wird im Entwicklungsmodus nicht versendet. Die Daten wurden in der Konsole ausgegeben.',
      });
      (event.target as HTMLFormElement).reset();
      return;
    }

    try {
      const formData = new FormData(event.target as HTMLFormElement);
      const response = await fetch('/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      toast({
        title: 'Meldung gesendet',
        description: 'Wir werden Ihre Meldung umgehend prüfen.',
      });

      (event.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Fehler beim Senden',
        description: 'Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Sicherheit bei Swoppa</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Swoppa ist eine Plattform, die Käufer und Verkäufer zusammenbringt. Erfahren Sie mehr über unsere
            Sicherheitsempfehlungen für einen sicheren Handel zwischen Nutzern.
          </p>
        </div>

        {/* Security Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {securityFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Safety Guidelines */}
        <div className="bg-secondary/10 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-bold mb-8">Sicherheitsrichtlinien</h2>
          <p className="text-muted-foreground mb-8">
            Swoppa ist eine reine Vermittlungsplattform. Alle Transaktionen und Zahlungen werden direkt zwischen den Nutzern abgewickelt.
            Beachten Sie folgende Richtlinien für einen sicheren Handel:
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {guidelines.map((section, index) => (
              <div key={index}>
                <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Reporting Process */}
        <div>
          <h2 className="text-2xl font-bold mb-8">Verdachtsfälle melden</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {reportingSteps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-primary">{index + 1}</span>
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            Haben Sie Fragen zur Sicherheit oder möchten Sie einen Vorfall melden?
          </p>
          <div className="max-w-md mx-auto">
            <form
              name="security"
              method="POST"
              data-netlify="true"
              data-netlify-honeypot="bot-field"
              onSubmit={handleSubmit}
              className="bg-white p-6 rounded-lg shadow-sm border space-y-4"
            >
              <input type="hidden" name="form-name" value="security" />
              <p className="hidden">
                <label>
                  Don't fill this out if you're human: <input name="bot-field" />
                </label>
              </p>
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input name="name" placeholder="Ihr Name" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">E-Mail</label>
                <Input type="email" name="email" placeholder="ihre.email@beispiel.ch" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Betreff</label>
                <Input name="subject" placeholder="Art des Vorfalls" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Beschreibung</label>
                <Textarea
                  name="message"
                  placeholder="Beschreiben Sie den Vorfall so genau wie möglich"
                  className="min-h-[150px]"
                  required
                />
              </div>
              <Button type="submit" className="w-full">Meldung absenden</Button>
            </form>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Hinweis: Swoppa ist nicht an Transaktionen zwischen Nutzern beteiligt und kann keine Garantie für Käufe,
            Verkäufe oder Tauschgeschäfte übernehmen. Seien Sie vorsichtig und folgen Sie unseren Sicherheitsrichtlinien.
          </p>
        </div>
      </div>
    </div>
  );
}