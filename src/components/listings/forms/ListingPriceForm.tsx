import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { ListingFormData } from './types';

interface ListingPriceFormProps {
  form: UseFormReturn<ListingFormData>;
}

export function ListingPriceForm({ form }: ListingPriceFormProps) {
  return (
    <FormField
      control={form.control}
      name="price"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Preis (CHF)</FormLabel>
          <FormControl>
            <Input
              type="number"
              value={field.value || ''}
              step="0.01"
              min="0"
              placeholder="0.00"
              onChange={(e) => field.onChange(parseFloat(e.target.value))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}