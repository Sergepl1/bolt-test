import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ListingFormData {
  title: string;
  category: string;
  description: string;
  type: 'fixed_price' | 'auction';
  price?: number;
  location: {
    lat?: number;
    lng?: number;
    address?: string;
    street?: string;
    houseNumber?: string;
    zip?: string;
    city?: string;
    canton?: string;
  };
  allow_trade: boolean;
  shipping_available: boolean;
}

interface ListingFormState {
  formData: ListingFormData | null;
  imageUrls: string[];
  titleImageIndex: number;
  setFormData: (data: ListingFormData) => void;
  setImageUrls: (urls: string[]) => void;
  setTitleImageIndex: (index: number) => void;
  clearForm: () => void;
  clearAll: () => void;
}

export const useListingFormStore = create<ListingFormState>()(
  persist(
    (set) => ({
      formData: null,
      imageUrls: [],
      titleImageIndex: 0,
      setFormData: (data) => set({ formData: data }),
      setImageUrls: (urls) => set({ imageUrls: urls }),
      setTitleImageIndex: (index) => set({ titleImageIndex: index }),
      clearForm: () => set({ formData: null }),
      clearAll: () => set({ formData: null, imageUrls: [], titleImageIndex: 0 }),
    }),
    {
      name: 'listing-form-storage',
    }
  )
);