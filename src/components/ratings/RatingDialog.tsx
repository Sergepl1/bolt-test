import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const ratingSchema = z.object({
  communication_rating: z.number().min(1).max(5),
  reliability_rating: z.number().min(1).max(5),
  overall_rating: z.number().min(1).max(5),
  comment: z.string().min(10, 'Bitte geben Sie einen Kommentar mit mindestens 10 Zeichen ein.'),
});

type RatingFormData = z.infer<typeof ratingSchema>;

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string;
  ratedUserId: string;
  onSuccess: () => void;
}

export function RatingDialog({ 
  open, 
  onOpenChange, 
  transactionId, 
  ratedUserId,
  onSuccess 
}: RatingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const form = useForm<RatingFormData>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      communication_rating: 0,
      reliability_rating: 0,
      overall_rating: 0,
      comment: '',
    },
  });

  const onSubmit = async (data: RatingFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ratings')
        .insert({
          transaction_id: transactionId,
          rated_id: ratedUserId,
          ...data,
        });

      if (error) throw error;

      toast({
        title: 'Bewertung gespeichert',
        description: 'Vielen Dank für Ihre Bewertung!',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: 'Fehler beim Speichern',
        description: 'Die Bewertung konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingInput = ({ name }: { name: keyof RatingFormData }) => {
    const rating = form.watch(name) as number;

    return (
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => form.setValue(name, value)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                value <= rating
                  ? 'fill-primary text-primary'
                  : 'text-muted-foreground hover:text-primary/50'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bewertung abgeben</DialogTitle>
          <DialogDescription>
            Wie war Ihre Erfahrung mit diesem Nutzer? Ihre Bewertung hilft anderen Mitgliedern.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="communication_rating"
              render={() => (
                <FormItem>
                  <FormLabel>Kommunikation</FormLabel>
                  <FormControl>
                    <RatingInput name="communication_rating" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reliability_rating"
              render={() => (
                <FormItem>
                  <FormLabel>Zuverlässigkeit</FormLabel>
                  <FormControl>
                    <RatingInput name="reliability_rating" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="overall_rating"
              render={() => (
                <FormItem>
                  <FormLabel>Gesamtbewertung</FormLabel>
                  <FormControl>
                    <RatingInput name="overall_rating" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kommentar</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Wie war Ihre Erfahrung?"
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Bewertung abgeben
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}