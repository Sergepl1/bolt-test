import { BookOpen, Calendar, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const featuredPost = {
  title: 'Die Zukunft des nachhaltigen Handels',
  excerpt: 'Wie lokale Marktplätze wie Swoppa die Art und Weise verändern, wie wir konsumieren und handeln.',
  image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=400&fit=crop',
  date: '15. Januar 2025',
  author: 'Jonas Volk',
  category: 'Nachhaltigkeit',
};

const recentPosts = [
  {
    title: 'Sicher handeln auf Swoppa: Unsere Top-Tipps',
    excerpt: 'Wie Sie sicher und entspannt auf unserem Marktplatz kaufen und verkaufen können.',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop',
    date: '10. Januar 2025',
    author: 'Jonas Volk',
    category: 'Sicherheit',
  },
  {
    title: 'Von der Idee zum erfolgreichen Verkauf',
    excerpt: 'Praktische Tipps für überzeugende Inserate und erfolgreiche Verkäufe.',
    image: 'https://images.unsplash.com/photo-1556155092-490a1ba16284?w=600&h=400&fit=crop',
    date: '5. Januar 2025',
    author: 'Jonas Volk',
    category: 'Verkaufstipps',
  },
  {
    title: 'Nachhaltigkeit im Alltag leben',
    excerpt: 'Kleine Veränderungen mit großer Wirkung für eine bessere Zukunft.',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&h=400&fit=crop',
    date: '1. Januar 2025',
    author: 'Jonas Volk',
    category: 'Nachhaltigkeit',
  },
];

const categories = [
  'Nachhaltigkeit',
  'Sicherheit',
  'Verkaufstipps',
  'Community',
  'Neuigkeiten',
  'Technologie',
];

export function BlogPage() {
  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Swoppa Blog</h1>
        <p className="text-lg text-muted-foreground">
          Entdecken Sie spannende Geschichten, hilfreiche Tipps und die neuesten
          Entwicklungen rund um nachhaltigen Handel.
        </p>
      </div>

      {/* Featured Post */}
      <div className="mb-16">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="aspect-[2/1] relative">
            <img
              src={featuredPost.image}
              alt={featuredPost.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <div className="flex items-center gap-4 text-sm mb-2">
                <span className="bg-primary/90 px-3 py-1 rounded-full">
                  {featuredPost.category}
                </span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {featuredPost.date}
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {featuredPost.author}
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-2">{featuredPost.title}</h2>
              <p className="text-white/90 mb-4">{featuredPost.excerpt}</p>
              <Button variant="secondary">Weiterlesen</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <h2 className="text-2xl font-bold mb-8">Aktuelle Beiträge</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {recentPosts.map((post, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-[3/2]">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <span className="text-primary">{post.category}</span>
                    <span>•</span>
                    <span>{post.date}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                  <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      {post.author}
                    </div>
                    <Button variant="link" className="p-0 h-auto">
                      Weiterlesen <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Kategorien</h3>
            <div className="space-y-2">
              {categories.map((category, index) => (
                <button
                  key={index}
                  className="block w-full text-left px-3 py-2 rounded-md hover:bg-secondary/50 transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bleiben Sie auf dem Laufenden und erhalten Sie die neuesten Artikel
              direkt in Ihr Postfach.
            </p>
            <Button className="w-full">Newsletter abonnieren</Button>
          </div>
        </div>
      </div>
    </div>
  );
}