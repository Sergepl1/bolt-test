import { Menu as MenuIcon, Gift, ShoppingBag, Repeat, Gavel, Heart, Shield, Users, TrendingUp, Plus, LogIn, X as CloseIcon } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthModal } from './components/auth/AuthModal';
import { UserMenu } from './components/auth/UserMenu';
import { useAuth } from './hooks/use-auth';
import { supabase } from './lib/supabase';
import { CreateListingForm } from './components/listings/CreateListingForm';
import { ListingPreview } from './components/listings/ListingPreview';
import { isSupabaseConfigured } from './lib/supabase';
import { ListingSuccess } from './components/listings/ListingSuccess';
import { MyListings } from './components/listings/MyListings';
import { ListingsOverview } from './components/listings/ListingsOverview';
import { AdminPage } from './pages/AdminPage';
import { EmailConfirmationPage } from './pages/EmailConfirmationPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ListingDetail } from './components/listings/ListingDetail';
import { AboutPage } from './pages/AboutPage';
import { TermsPage } from './pages/TermsPage';
import { BuyAndSellPage } from './pages/BuyAndSellPage';
import { GiveawayPage } from './pages/GiveawayPage';
import { AuctionPage } from './pages/AuctionPage';
import { TradePage } from './pages/TradePage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ImprintPage } from './pages/ImprintPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { FAQPage } from './pages/FAQPage';
import { CookieSettingsPage } from './pages/CookieSettingsPage';
import { SecurityPage } from './pages/SecurityPage';
import { SupportPage } from './pages/SupportPage';
import { CareersPage } from './pages/CareersPage';
import { BlogPage } from './pages/BlogPage';
import { PressPage } from './pages/PressPage';
import { ContactPage } from './pages/ContactPage';
import { MessagesPage } from './pages/MessagesPage';
import { ProfilePage } from './pages/ProfilePage';
import { SellerProfilePage } from './pages/SellerProfilePage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ScrollToTop } from '@/components/ScrollToTop';
import { CookieBanner } from '@/components/CookieBanner';

const images = [
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1598986646512-9330bcc4c0dc?w=400&h=300&fit=crop",
];

const features = [
  {
    icon: ShoppingBag,
    title: "Kaufen",
    description: "Entdecke einzigartige Angebote und finde genau das, was du suchst. Von seltenen Sammlerstücken bis hin zu alltäglichen Schnäppchen – Swoppa macht das Kaufen einfach und lokal. Verhandle direkt mit Verkäufern und spare Versandkosten, indem du Artikel in deiner Nähe findest. So wird Einkaufen persönlicher und nachhaltiger."
  },
  {
    icon: Gift,
    title: "Verkaufen",
    description: "Verwandle ungenutzte Dinge in bares Geld und mache anderen eine Freude. Auf Swoppa kannst du deine Artikel schnell und unkompliziert einstellen und direkt mit Käufern in Kontakt treten. Ob große oder kleine Dinge – Swoppa bietet dir eine Plattform, auf der du alles, was du nicht mehr brauchst, an die richtige Person weitergeben kannst."
  },
  {
    icon: Repeat,
    title: "Verschenken",
    description: "Bring Freude in den Alltag anderer, indem du Dinge, die du nicht mehr benötigst, verschenkst. Mit Swoppa kannst du ungenutzten Gegenständen ein zweites Leben schenken und gleichzeitig Platz schaffen. Einfach einstellen, Kontakte knüpfen und wissen, dass deine Sachen in guten Händen sind."
  },
  {
    icon: Leaf,
    title: "Tauschen",
    description: "Tauschen statt kaufen: Finde neue Schätze, indem du Gegenstände direkt mit anderen Mitgliedern austauschst. Swoppa ermöglicht es dir, individuell zu verhandeln und neue Lieblingsstücke zu entdecken – alles ohne zusätzlichen Aufwand. Perfekt, um Ressourcen zu sparen und kreativ zu handeln."
  }
];

const benefits = [
  {
    icon: Shield,
    title: "Einfach & Flexibel",
    description: "Mit Swoppa entscheidest du, wie du handeln möchtest – ohne komplizierte Vorgaben. Tausche direkt Nachrichten aus, vereinbare individuelle Konditionen und kläre alles unkompliziert mit deinem Handelspartner. Ob du verkaufen, tauschen oder verschenken möchtest – Swoppa passt sich deinen Bedürfnissen an und bietet dir maximale Flexibilität bei jeder Transaktion."
  },
  {
    icon: Users,
    title: "Lokale Community",
    description: "Verbinde dich mit Menschen aus deiner Umgebung und mach nachhaltige Deals. Durch den lokalen Handel sparst du Versandkosten und reduzierst deinen ökologischen Fußabdruck. Swoppa bringt Nachbarn zusammen, um Dinge direkt und unkompliziert auszutauschen oder zu verkaufen – für eine starke Community in deiner Nähe."
  },
  {
    icon: TrendingUp,
    title: "Faire Preise",
    description: "Finde Angebote, die zu deinem Budget passen, und vergleiche Artikel mühelos, um den besten Deal zu machen. Swoppa bietet dir eine Plattform mit transparenter Preisgestaltung und fairen Möglichkeiten für Käufer und Verkäufer. So kannst du sicher sein, dass du immer das beste Preis-Leistungs-Verhältnis erhältst."
  }
];

const categoryImages = {
  'Elektronik': "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400&h=400&fit=crop",
  'Mode': "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop",
  'Möbel': "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=400&h=400&fit=crop",
  'Sport': "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop",
  'Auto & Motorrad': "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400&h=400&fit=crop",
  'Bücher & Medien': "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=400&fit=crop",
  'Sammeln': "https://images.unsplash.com/photo-1602532305019-3dbbd482dae9?w=400&h=400&fit=crop",
  'Garten': "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=400&fit=crop",
  'Spielzeug': "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop",
  'Sonstiges': "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=400&fit=crop",
};

type CategoryCount = {
  title: string;
  items: number;
  image: string;
};

// Add debug logging for menu state changes
const useMenuState = (initialState: boolean) => {
  const [isOpen, setIsOpen] = useState(initialState);
  
  const toggleMenu = () => {
    console.log('Toggling menu:', !isOpen); // Debug log
    setIsOpen(!isOpen);
  };
  
  return [isOpen, setIsOpen, toggleMenu] as const;
};

function App() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen, toggleMobileMenu] = useMenuState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([]);
  const supabaseReady = isSupabaseConfigured();
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show auth modal when redirected from protected route
  useEffect(() => {
    if (location.state?.from) {
      setShowAuthModal(true);
    }
  }, [location]);

  useEffect(() => {
    async function fetchCategoryCounts() {
      try {
        if (!supabaseReady) {
          // Don't attempt to fetch if Supabase is not configured
          return;
        }

        const { data, error } = await supabase
          .from('listings')
          .select('category')
          .eq('status', 'active');

        if (error) throw error;

        // Count listings per category
        const counts = data.reduce((acc: { [key: string]: number }, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {});

        // Convert to array and sort by count
        const sortedCategories = Object.entries(counts)
          .map(([title, items]) => ({
            title,
            items,
            image: categoryImages[title as keyof typeof categoryImages] || categoryImages['Sonstiges']
          }))
          .sort((a, b) => b.items - a.items)
          .slice(0, 4); // Get top 4 categories

        setCategoryCounts(sortedCategories);
      } catch (error) {
        console.error('Error fetching category counts:', error);
      }
    }

    fetchCategoryCounts();
  }, [supabaseReady]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <ScrollToTop />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden relative z-50"
                onClick={toggleMobileMenu}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <CloseIcon className="h-6 w-6" />
                ) : (
                  <MenuIcon className="h-6 w-6" />
                )}
              </Button>
              <Link to="/" className="text-2xl font-bold hover:text-primary transition-colors">
                Swoppa
              </Link>
            </div>
            <div className="hidden lg:flex items-center gap-6">
              {!supabaseReady && (
                <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-md shadow-sm">
                  Bitte klicke auf "Connect to Supabase" oben rechts, um die Datenbank zu verbinden.
                </div>
              )}
              <Link to="/listings" className="text-sm font-medium">
                Entdecken
              </Link>
              <Link to="/about" className="text-sm font-medium">
                Über uns
              </Link>
              {user?.user_metadata.username === 'admin' && (
                <Link to="/admin" className="text-sm font-medium">
                  Admin
                </Link>
              )}
              {user && (
                <Link to="/listings/my" className="text-sm font-medium">
                  Meine Inserate
                </Link>
              )}
              <Link to="/favorites" className="flex items-center gap-1 text-sm font-medium">
                <Heart className="h-5 w-5" />
                <span>Favoriten</span>
              </Link>
              {user && (
                <Link
                to="/listings/new"
                className="flex items-center gap-1 text-sm font-medium"
              >
                <Plus className="h-5 w-5" />
                <span>Inserieren</span>
                </Link>
              )}
              {loading ? (
                <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />
              ) : user ? (
                <UserMenu
                  username={user.user_metadata.username || user.email}
                  avatarUrl={user.user_metadata.avatar_url}
                />
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setShowAuthModal(true)}
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  <span>Anmelden</span>
                </Button>
              )}
            </div>
            <div className="flex lg:hidden items-center gap-4">
              {loading ? (
                <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />
              ) : user ? (
                <UserMenu
                  username={user.user_metadata.username || user.email}
                  avatarUrl={user.user_metadata.avatar_url}
                />
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setShowAuthModal(true)}
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  <span>Anmelden</span>
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          <div
            className={`lg:hidden fixed inset-x-0 top-16 bottom-0 bg-white/100 border-t transform transition-transform duration-300 ease-in-out shadow-lg ${
              isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
            }`}
            aria-hidden={!isMobileMenuOpen}
            style={{
              visibility: isMobileMenuOpen ? 'visible' : 'hidden',
              transitionProperty: 'transform, visibility',
              transitionDuration: '300ms',
              backgroundColor: 'white'
            }}
          >
            <nav className="container mx-auto px-4 py-4 bg-white">
              <div className="space-y-0.5">
              <Link
                to="/listings"
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-secondary rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ShoppingBag className="h-5 w-5" />
                <span>Entdecken</span>
              </Link>
              <Link
                to="/about"
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-secondary rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Users className="h-5 w-5" />
                <span>Über uns</span>
              </Link>
              {user?.user_metadata.username === 'admin' && (
                <Link
                  to="/admin"
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-secondary rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Shield className="h-5 w-5" />
                  <span>Admin</span>
                </Link>
              )}
              <Link
                to="/favorites"
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-secondary rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Heart className="h-5 w-5" />
                <span>Favoriten</span>
              </Link>
              {user && (
                <>
                  <Link
                    to="/listings/my"
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-secondary rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <MenuIcon className="h-5 w-5" />
                    <span>Meine Inserate</span>
                  </Link>
                  <Link
                    to="/listings/new"
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-secondary rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Plus className="h-5 w-5" />
                    <span>Inserieren</span>
                  </Link>
                </>
              )}
              </div>
              <div className="mt-4 pt-4 border-t">
                {!user ? (
                <Button
                  className="w-full justify-center gap-2 h-12 text-base"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowAuthModal(true);
                  }}
                >
                  <LogIn className="h-5 w-5" />
                  <LogIn className="h-6 w-6" />
                  <span>Anmelden</span>
                </Button>
                ) : (
                <Button
                  variant="outline"
                  className="w-full justify-center gap-2 h-12 text-base"
                  onClick={toggleMobileMenu}
                >
                  <CloseIcon className="h-6 w-6" />
                  <span>Menü schließen</span>
                </Button>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Routes */}
      <Routes>
        <Route
          path="/listings/:id"
          element={
            <div className="container mx-auto px-4 pt-24 mb-24">
              <ListingDetail />
            </div>
          }
        />
        <Route
          path="/"
          element={
            <main className="pt-24">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left Content */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <div className="absolute -top-4 left-0 w-24 h-0.5 bg-primary" />
                <p className="text-primary mb-4">Kaufen und Verkaufen leicht gemacht.</p>
                <h2 className="text-5xl font-bold mb-6 leading-tight">
                  Dein lokaler Marktplatz für Gebrauchtes und Neues
                </h2>
                <div className="relative">
                  <div className="absolute -bottom-4 right-0 w-24 h-0.5 bg-primary" />
                  <div className="flex gap-4">
                    <Link
                      to="/listings/new"
                      className="bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 transition-colors"
                    >
                      Jetzt verkaufen →
                    </Link>
                    <Link
                      to="/listings"
                      className="bg-secondary text-secondary-foreground px-6 py-3 rounded-full hover:bg-secondary/90 transition-colors"
                    >
                      Stöbern
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Image Gallery */}
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4">
                {images.map((src, index) => (
                  <div
                    key={index}
                    className={`transition-all duration-500 ${
                      index === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-60 scale-95'
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Gallery image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg shadow-md"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-32 py-24">
            <h3 className="text-4xl font-bold text-center mb-4">So funktioniert's</h3>
            <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
              Entdecke die verschiedenen Möglichkeiten auf Swoppa
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Link
                to="/buy-and-sell"
                className="p-8 hover:bg-secondary/50 rounded-2xl transition-all group h-full"
              >
                <ShoppingBag className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="text-lg font-semibold mb-2">Kaufen</h4>
                <p className="text-muted-foreground">
                  Entdecke einzigartige Angebote und finde genau das, was du suchst. Von seltenen Sammlerstücken bis hin zu alltäglichen Schnäppchen – Swoppa macht das Kaufen einfach und lokal. Verhandle direkt mit Verkäufern und spare Versandkosten durch lokale Übergabe.
                </p>
              </Link>
              <Link
                to="/listings/new"
                className="p-8 hover:bg-secondary/50 rounded-2xl transition-all group h-full"
              >
                <Gift className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="text-lg font-semibold mb-2">Verkaufen</h4>
                <p className="text-muted-foreground">
                  Verwandle ungenutzte Dinge in bares Geld. Erstelle kostenlos ein Inserat und erreiche interessierte Käufer in deiner Nähe. Kommuniziere direkt, handle faire Preise aus und übergib persönlich – einfach und sicher.
                </p>
              </Link>
              <Link
                to="/giveaway"
                className="p-8 hover:bg-secondary/50 rounded-2xl transition-all group h-full"
              >
                <Repeat className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="text-lg font-semibold mb-2">Verschenken</h4>
                <p className="text-muted-foreground">
                  Gib nicht mehr benötigten Dingen ein zweites Leben und mache anderen eine Freude. Stelle deine Artikel kostenlos ein und finde Menschen in deiner Nähe, die sie gut gebrauchen können. Nachhaltig und sozial.
                </p>
              </Link>
              <Link
                to="/trade"
                className="p-8 hover:bg-secondary/50 rounded-2xl transition-all group h-full"
              >
                <Leaf className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="text-lg font-semibold mb-2">Tauschen</h4>
                <p className="text-muted-foreground">
                  Tausche direkt mit anderen Mitgliedern und entdecke spannende Alternativen zum klassischen Kauf. Verhandle individuell, finde neue Lieblingsstücke und spare dabei Geld. Nachhaltiger Konsum leicht gemacht.
                </p>
              </Link>
            </div>
          </div>

          {/* Categories Section */}
          <div className="mt-32 py-24 bg-secondary/10">
            <h3 className="text-4xl font-bold text-center mb-4">Beliebte Kategorien</h3>
            <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
              Entdecke tausende Artikel in unseren beliebtesten Kategorien
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categoryCounts.map((category, index) => (
                <Link
                  key={index}
                  to={`/listings?category=${encodeURIComponent(category.title)}`}
                  className="group relative overflow-hidden rounded-2xl bg-white transition-all hover:shadow-lg"
                >
                  <img
                    src={category.image}
                    alt={category.title}
                    className="w-full aspect-square object-cover transition-transform group-hover:scale-105 duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                    <h4 className="text-white text-xl font-semibold">{category.title}</h4>
                    <p className="text-white/80">{category.items} Artikel</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mt-32 py-24">
            <h3 className="text-4xl font-bold text-center mb-4">Deine Vorteile mit Swoppa</h3>
            <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
              Finde, was du suchst – schnell, fair und in deiner Nähe.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center p-8 hover:bg-secondary/50 rounded-2xl transition-all group">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 group-hover:scale-110 transition-transform">
                    <benefit.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">{benefit.title}</h4>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-32 mb-16 text-center py-24 bg-secondary/10">
            <h2 className="text-5xl font-bold leading-tight mb-8">
              Bereit zum Handeln?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Werde Teil der Swoppa-Community und entdecke eine neue Art des nachhaltigen Handelns.
            </p>
            <Button
              size="lg"
              className="px-8 py-4 rounded-full text-lg"
              onClick={() => setShowAuthModal(true)}
            >
              Jetzt kostenlos registrieren
            </Button>
          </div>
        </div>
            </main>
          }
        />
          <Route
            path="/about"
            element={<AboutPage />}
          />
          <Route
            path="/buy-and-sell"
            element={<BuyAndSellPage />}
          />
          <Route
            path="/giveaway"
            element={<GiveawayPage />}
          />
          <Route
            path="/trade"
            element={<TradePage />}
          />
          <Route
            path="/faq"
            element={<FAQPage />}
          />
          <Route
            path="/contact"
            element={<ContactPage />}
          />
          <Route
            path="/imprint"
            element={<ImprintPage />}
          />
          <Route
            path="/terms"
            element={<TermsPage />}
          />
          <Route
            path="/privacy"
            element={<PrivacyPage />}
          />
          <Route
            path="/cookie-settings"
            element={<CookieSettingsPage />}
          />
          <Route
            path="/security"
            element={<SecurityPage />}
          />
          <Route
            path="/support"
            element={<SupportPage />}
          />
          <Route
            path="/careers"
            element={<CareersPage />}
          />
          <Route
            path="/press"
            element={<PressPage />}
          />
          <Route
            path="/blog"
            element={<BlogPage />}
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute showAuthModal={() => setShowAuthModal(true)}>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={<ProfilePage />}
          />
          <Route
            path="/favorites"
            element={<FavoritesPage />}
          />
          <Route
            path="/listings"
            element={<ListingsOverview />}
          />
          <Route
            path="/listings/new"
            element={
              <ProtectedRoute showAuthModal={() => setShowAuthModal(true)}>
                <div className="container mx-auto px-4 pt-24 mb-24">
                  <h1 className="text-2xl font-bold mb-8">
                    {location.pathname.includes('/edit') ? 'Inserat bearbeiten' : 'Neues Inserat erstellen'}
                  </h1>
                  <CreateListingForm />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/listings/:id/edit"
            element={
              <ProtectedRoute showAuthModal={() => setShowAuthModal(true)}>
                <div className="container mx-auto px-4 pt-24 mb-24">
                  <h1 className="text-2xl font-bold mb-8">Inserat bearbeiten</h1>
                  <CreateListingForm mode="edit" />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/listings/:id/preview"
            element={
              <div className="container mx-auto px-4 pt-24 mb-24">
                <h1 className="text-2xl font-bold mb-8">Inseratsvorschau</h1>
                <ListingPreview />
              </div>
            }
          />
          <Route
            path="/listings/:id/success"
            element={
              <div className="container mx-auto px-4 pt-24 mb-24">
                <ListingSuccess />
              </div>
            }
          />
          <Route
            path="/listings/my"
            element={
              <ProtectedRoute showAuthModal={() => setShowAuthModal(true)}>
                <div className="container mx-auto px-4 pt-24 mb-24">
                  <MyListings />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sellers/:sellerId/:listingId?"
            element={<SellerProfilePage />}
          />
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />
        <Route
          path="/auth/confirm"
          element={<EmailConfirmationPage />}
        />
        <Route
          path="/admin"
          element={<AdminPage />}
        />
      </Routes>
      
      {/* Footer */}
      <footer className="bg-secondary/10 border-t">
        <div className="max-w-[1400px] mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <h4 className="font-bold text-lg mb-4">Über Swoppa</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">Über uns</Link></li>
                <li><Link to="/careers" className="text-muted-foreground hover:text-foreground transition-colors">Karriere</Link></li>
                <li><Link to="/press" className="text-muted-foreground hover:text-foreground transition-colors">Presse</Link></li>
                <li><Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Hilfe</h4>
              <ul className="space-y-2">
                <li><Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
                <li><Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Kontakt</Link></li>
                <li><Link to="/security" className="text-muted-foreground hover:text-foreground transition-colors">Sicherheit</Link></li>
                <li><Link to="/support" className="text-muted-foreground hover:text-foreground transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Rechtliches</h4>
              <ul className="space-y-2">
                <li><Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">AGB</Link></li>
                <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Datenschutz</Link></li>
                <li><Link to="/imprint" className="text-muted-foreground hover:text-foreground transition-colors">Impressum</Link></li>
                <li><Link to="/cookie-settings" className="text-muted-foreground hover:text-foreground transition-colors">Cookie-Einstellungen</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              © 2025 Swoppa. Alle Rechte vorbehalten.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Facebook
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Instagram
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Twitter
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      <CookieBanner />
    </div>
  );
}

export default App;