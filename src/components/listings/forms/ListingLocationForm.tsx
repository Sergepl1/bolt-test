import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navigation, Loader2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { ListingFormData } from './types';

const cantons = [
  'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR',
  'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG',
  'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH'
];

interface ListingLocationFormProps {
  form: UseFormReturn<ListingFormData>;
  isLocating: boolean;
  detectLocation: () => Promise<void>;
}

export function ListingLocationForm({ form, isLocating, detectLocation }: ListingLocationFormProps) {
  return (
    <FormField
      control={form.control}
      name="location"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center justify-between">
            <span>Standort</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={detectLocation}
              disabled={isLocating}
              className="gap-2"
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              <span>Standort ermitteln</span>
            </Button>
          </FormLabel>
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="location.street"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Strasse</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Bahnhofstrasse" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location.houseNumber"
                  render={({ field }) => (
                    <FormItem className="w-24">
                      <FormLabel>Nr.</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="location.zip"
                  render={({ field }) => (
                    <FormItem className="w-24">
                      <FormLabel>PLZ</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="8000" maxLength={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location.city"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Ort</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Zürich" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="location.canton"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kanton</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wähle einen Kanton" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cantons.map((canton) => (
                          <SelectItem key={canton} value={canton}>
                            {canton}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}