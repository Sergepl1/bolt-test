import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { ListingFormData } from './types';

const categories = [
  'Elektronik',
  'Mode',
  'Möbel',
  'Sport',
  'Auto & Motorrad',
  'Bücher & Medien',
  'Sammeln',
  'Garten',
  'Spielzeug',
  'Sonstiges',
];

interface ListingBasicInfoFormProps {
  form: UseFormReturn<ListingFormData>;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

export function ListingBasicInfoForm({ form, selectedCategory, setSelectedCategory }: ListingBasicInfoFormProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Titel</FormLabel>
            <FormControl>
              <Input {...field} placeholder="z.B. iPhone 12 Pro, 256GB, Space Gray" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kategorie</FormLabel>
            <Select 
              onValueChange={(value) => {
                field.onChange(value);
                setSelectedCategory(value);
              }} 
              value={selectedCategory || field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Wähle eine Kategorie" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="condition"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Zustand</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Wähle den Zustand" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="new">Neu</SelectItem>
                <SelectItem value="used">Gebraucht</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Beschreibung</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Beschreibe deinen Artikel möglichst genau..."
                className="min-h-[200px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}