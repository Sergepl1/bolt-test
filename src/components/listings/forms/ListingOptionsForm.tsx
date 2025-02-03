import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { UseFormReturn } from 'react-hook-form';
import { ListingFormData } from './types';

interface ListingOptionsFormProps {
  form: UseFormReturn<ListingFormData>;
}

export function ListingOptionsForm({ form }: ListingOptionsFormProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="allow_trade"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between">
            <div>
              <FormLabel>Tausch möglich</FormLabel>
              <FormDescription>
                Andere Nutzer können Tauschangebote machen
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="shipping_available"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between">
            <div>
              <FormLabel>Versand möglich</FormLabel>
              <FormDescription>
                Der Artikel kann auch versendet werden
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}