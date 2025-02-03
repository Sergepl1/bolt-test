export interface ListingFormData {
  title: string;
  category: string;
  condition: 'new' | 'used';
  description: string;
  type: 'fixed_price';
  price: number;
  location: {
    lat?: number;
    lng?: number;
    address?: string;
    street: string;
    houseNumber: string;
    zip: string;
    city: string;
    canton: string;
  };
  allow_trade: boolean;
  shipping_available: boolean;
}