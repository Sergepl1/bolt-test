import { Building2, Heart, Leaf, ShieldCheck, Users } from 'lucide-react';

const values = [
  {
    icon: Heart,
    title: 'Gemeinschaft',
    description: 'Wir schaffen eine vertrauensvolle Plattform, auf der Menschen sicher und fair handeln können.',
  },
  {
    icon: Leaf,
    title: 'Nachhaltigkeit',
    description: 'Durch Wiederverwendung und lokalen Handel tragen wir aktiv zum Umweltschutz bei.',
  },
  {
    icon: ShieldCheck,
    title: 'Sicherheit',
    description: 'Die Sicherheit unserer Nutzer und ihrer Daten hat für uns höchste Priorität.',
  },
  {
    icon: Users,
    title: 'Fairness',
    description: 'Wir setzen uns für faire Preise und transparente Geschäftspraktiken ein.',
  },
];

const team = [
  {
    name: 'Jonas Volk',
    role: 'CEO & Gründer',
    image: 'https://github.com/volk-academy/swoppa/blob/main/DSC_3429_bearb_quadr.jpg?raw=true',
    bio: 'Der Visionär, der manchmal nachts um 3 Ideen hat – und sich dann selber Mails schreibt.',
  },
  {
    name: 'Jonas Volk',
    role: 'CTO',
    image: 'https://github.com/volk-academy/swoppa/blob/main/DSC_3429_bearb_quadr.jpg?raw=true',
    bio: 'Wenn’s nicht läuft, ruft er sich selbst an – und löst es meistens.',
  },
  {
    name: 'Jonas Volk',
    role: 'Head of Community',
    image: 'https://github.com/volk-academy/swoppa/blob/main/DSC_3429_bearb_quadr.jpg?raw=true',
    bio: 'Kann nicht nur Menschen vernetzen, sondern wahrscheinlich auch Toaster mit Kühlschränken.',
  },
];

export function AboutPage() {
  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-24">
        <h1 className="text-4xl font-bold mb-6">
          Wir machen lokalen Handel einfach, sicher und nachhaltig
        </h1>
        <p className="text-lg text-muted-foreground">
          Swoppa wurde mit der Vision gegründet, Menschen in ihrer Nachbarschaft
          zusammenzubringen und nachhaltigen Konsum zu fördern.
        </p>
      </div>

      {/* Story Section */}
      <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
        <div>
          <h2 className="text-3xl font-bold mb-6">Unsere Geschichte</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Willkommen bei Swoppa – dem Marktplatz, auf dem Nachhaltigkeit, Gemeinschaft und großartige Deals aufeinandertreffen!
            </p>
            <p>
              Was einst mit einer einfachen Idee begann („Warum Dinge wegwerfen, wenn sie jemand anderes lieben könnte?“), hat sich zu einer Plattform                  entwickelt, die den Handel zwischen Privatpersonen neu definiert. Bei Swoppa kannst du kaufen, tauschen und verkaufen – unkompliziert, fair               und mit Spaß.
            </p>
            <p>
          Unser Ziel? Wir möchten nicht nur Second-Hand-Produkte vermitteln, sondern auch Geschichten. Jedes Produkt hat eine Vergangenheit, und auf Swoppa findet es ein neues Zuhause – ob durch einen Kauf oder einen coolen Tausch. Dabei legen wir besonderen Wert auf eine starke Community, in der Vertrauen, Ehrlichkeit und ein lockerer Umgangston herrschen.
            </p>
                        <p>
          Wir glauben daran, dass ein nachhaltiger Lebensstil nicht langweilig, sondern innovativ und cool sein kann. Darum gestalten wir die Plattform so, dass sie dich inspiriert und motiviert, dein altes Fahrrad, deine Gaming-Konsole oder den Vintage-Schrank weiterzugeben – und dabei vielleicht genau das zu finden, was du schon immer gesucht hast.
            </p>
                        <p>
    Ob du also stöbern, handeln oder einfach nur die Community kennenlernen möchtest – bei Swoppa bist du richtig.

            </p>
                        <p>
      Lass uns gemeinsam Swoppen und die Welt ein bisschen nachhaltiger machen – ein Deal nach dem anderen.
            </p>
          </div>
        </div>
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop"
            alt="Team Meeting"
            className="rounded-lg shadow-lg"
          />
          <div className="absolute inset-0 bg-primary/10 rounded-lg" />
        </div>
      </div>

      {/* Values */}
      <div className="mb-24">
        <h2 className="text-3xl font-bold text-center mb-12">Unsere Werte</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <div
              key={index}
              className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <value.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
              <p className="text-muted-foreground">{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div>
        <h2 className="text-3xl font-bold text-center mb-12">Unser Team</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <div
              key={index}
              className="text-center p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <img
                src={member.image}
                alt={member.name}
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="text-lg font-semibold">{member.name}</h3>
              <p className="text-sm text-primary mb-4">{member.role}</p>
              <p className="text-muted-foreground">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}