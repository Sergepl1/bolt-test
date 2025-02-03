import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const reportSchema = z.object({
  reason: z.enum(['inappropriate', 'scam', 'misleading', 'counterfeit', 'offensive', 'other'], {
    required_error: 'Bitte wählen Sie einen Grund aus',
  }),
  details: z.string().min(10, 'Bitte geben Sie mindestens 10 Zeichen ein').max(1000, 'Maximal 1000 Zeichen'),
});

type ReportFormData = z.infer<typeof reportSchema>;

const reportReasons = {
  inappropriate: 'Unangemessener Inhalt',
  scam: 'Betrug/Täuschung',
  misleading: 'Irreführende Informationen',
  counterfeit: 'Gefälschte Ware',
  offensive: 'Beleidigender Inhalt',
  other: 'Sonstiges',
};

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  onSuccess?: () => void;
}

export function ReportDialog({ open, onOpenChange, listingId, onSuccess }: ReportDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reason: undefined,
      details: '',
    },
  });

  const onSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('listing_reports')
        .insert({
          listing_id: listingId,
          reporter_id: user?.id || '00000000-0000-0000-0000-000000000000',
          reason: data.reason,
          details: data.details,
          status: 'pending'
        });

      if (error) throw error;

      onOpenChange(false);
      form.reset();

      toast({
        title: 'Meldung gesendet',
        description: 'Vielen Dank für Ihre Meldung. Wir werden den Fall schnellstmöglich prüfen.',
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: 'Fehler beim Senden',
        description: 'Die Meldung konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Inserat melden
          </DialogTitle>
          <DialogDescription>
            Bitte helfen Sie uns, die Qualität und Sicherheit unserer Plattform zu gewährleisten.
            Ihre Meldung wird vertraulich behandelt.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grund der Meldung</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wählen Sie einen Grund" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(reportReasons).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Beschreiben Sie das Problem möglichst genau..."
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
                Melden
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}