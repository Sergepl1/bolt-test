import { Repeat, Search, SlidersHorizontal } from 'lucide-react';
import { ListingsOverview } from '@/components/listings/ListingsOverview';

export function TradePage() {
  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <Repeat className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Tauschen</h1>
        <p className="text-lg text-muted-foreground">
          Tausche Gegenstände direkt mit anderen Mitgliedern.
          Eine nachhaltige Alternative zum klassischen Kauf und Verkauf.
        </p>
      </div>

      {/* Listings */}
      <ListingsOverview defaultType="trade" />
    </div>
  );
}