import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form'; 
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useListingFormStore } from '@/lib/store';
import { ListingBasicInfoForm } from './forms/ListingBasicInfoForm';
import { ListingImageUpload } from './forms/ListingImageUpload';
import { ListingLocationForm } from './forms/ListingLocationForm';
import { ListingPriceForm } from './forms/ListingPriceForm';
import { ListingOptionsForm } from './forms/ListingOptionsForm';
import type { ListingFormData } from './forms/types';

import {
  Form,
  FormLabel,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { getCurrentLocation, reverseGeocode } from '@/lib/utils/location';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';

const listingSchema = z.object({
  title: z.string().min(3, 'Titel muss mindestens 3 Zeichen lang sein').max(100, 'Titel darf maximal 100 Zeichen lang sein'),
  category: z.string().min(1, 'Bitte wählen Sie eine Kategorie'),
  condition: z.enum(['new', 'used']),
  description: z.string().min(10, 'Beschreibung muss mindestens 10 Zeichen lang sein').max(2000, 'Beschreibung darf maximal 2000 Zeichen lang sein'),
  type: z.literal('fixed_price').default('fixed_price'),
  price: z.number().min(0, 'Preis muss mindestens 0 sein'),
  location: z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    address: z.string().optional(),
    street: z.string().min(1, 'Straße ist erforderlich'),
    houseNumber: z.string().min(1, 'Hausnummer ist erforderlich'),
    zip: z.string().regex(/^[1-9]\d{3}$/, "Ungültige PLZ"),
    city: z.string().min(1, 'Ort ist erforderlich'),
    canton: z.string().min(1, 'Kanton ist erforderlich'),
  }),
  allow_trade: z.boolean(),
  shipping_available: z.boolean()
});

interface CreateListingFormProps {
  mode?: 'create' | 'edit';
}

export function CreateListingForm({ mode = 'create' }: CreateListingFormProps) {
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [titleImageIndex, setTitleImageIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [existingListing, setExistingListing] = useState<ListingWithImages | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();
  const store = useListingFormStore();
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      category: selectedCategory || '',
      condition: 'used',
      description: '',
      type: 'fixed_price',
      price: 0,
      allow_trade: false,
      shipping_available: false,
      location: {
        lat: 0,
        lng: 0,
        address: '',
        street: '',
        houseNumber: '',
        zip: '',
        city: '',
        canton: '',
      },
    }
  });

  const fetchListing = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          listing_images (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setExistingListing(data);
      setSelectedCategory(data.category || '');
      
      if (data) {
        const location = data.location as any;
        form.reset({
          title: data.title,
          category: data.category || '',
          description: data.description || '',
          type: data.type,
          price: data.price ?? 0,
          allow_trade: data.allow_trade,
          shipping_available: data.shipping_available,
          location: {
            lat: location.lat || 0,
            lng: location.lng || 0,
            address: location.address || '',
            street: location.street || '',
            houseNumber: location.houseNumber || '',
            zip: location.zip || '',
            city: location.city || '',
            canton: location.canton || '',
          },
        });

        if (data.listing_images) {
          setImageUrls(data.listing_images.map(img => img.url));
        }
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast({
        title: 'Fehler beim Laden des Inserats',
        description: 'Bitte versuchen Sie es später erneut',
        variant: 'destructive',
      });
      navigate('/listings/my');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If we have stored form data, use it
    if (store.formData && !id) {
      setSelectedCategory(store.formData.category);
      form.reset(store.formData);
      setImageUrls(store.imageUrls || []);
      setTitleImageIndex(store.titleImageIndex);
    }

    // If we're in edit mode, fetch the listing
    if (mode === 'edit' && id) {
      setIsLoading(true);
      fetchListing();
    }

    // Cleanup stored form data when component unmounts
    return () => {
      if (!id) {
        store.clearForm();
        setSelectedCategory('');
      }
    };
  }, [mode, id]);

  const detectLocation = async () => {
    setIsLocating(true);
    try {
      const coords = await getCurrentLocation();
      const addressData = await reverseGeocode(coords.lat, coords.lng);
      
      // Update all location fields individually
      form.setValue('location.lat', coords.lat);
      form.setValue('location.lng', coords.lng);
      form.setValue('location.street', addressData.street);
      form.setValue('location.houseNumber', addressData.houseNumber);
      form.setValue('location.zip', addressData.zip);
      form.setValue('location.city', addressData.city);
      form.setValue('location.canton', addressData.canton);
      form.setValue('location.address', addressData.display_name);
    } catch (error) {
      toast({
        title: 'Fehler bei der Standortermittlung',
        description: 'Bitte geben Sie Ihren Standort manuell ein',
        variant: 'destructive',
      });
    } finally {
      setIsLocating(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    if (titleImageIndex === index) {
      setTitleImageIndex(0);
    } else if (titleImageIndex > index) {
      setTitleImageIndex(titleImageIndex - 1);
    }
  };

  const onSubmit = async (data: ListingFormData) => {
    setIsSubmitting(true);
    try {
      if (!user && !id) {
        toast({
          title: 'Anmeldung erforderlich',
          description: 'Bitte melden Sie sich an, um ein Inserat zu erstellen.',
          variant: 'destructive',
        });
        return;
      }

      // Always provide a valid location object
      const location = {
            lat: data.location.lat || 0,
            lng: data.location.lng || 0,
            ...data.location,
            address: [
              data.location.street,
              data.location.houseNumber,
              data.location.zip,
              data.location.city,
              data.location.canton
            ].filter(Boolean).join(' ')
      };

      const submissionData = {
        ...data,
        location,
        price: data.type === 'fixed_price' ? data.price || 0 : null,
        status: 'pending', // Submit for review
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        condition: data.condition || 'used'
      };

      let listing;
      
      if (mode === 'edit' && id) {
        // Update existing listing
        const { data, error: updateError } = await supabase
          .from('listings')
          .update(submissionData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;
        listing = data;
      } else {
        // Create new listing
        const { data, error: createError } = await supabase
          .from('listings')
          .insert([submissionData])
          .select()
          .single();

        if (createError) throw createError;
        listing = data;
      }

      // Handle new images
      if (images.length > 0) {
        const imageUploads = images.map(async (file, index) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('listings')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('listings')
            .getPublicUrl(fileName);

          return {
            url: publicUrl,
            position: index,
            is_featured: index === titleImageIndex,
          };
        });

        const uploadedImages = await Promise.all(imageUploads);

        // Add new images to the listing
        const { error: imagesError } = await supabase
          .from('listing_images')
          .insert(
            uploadedImages.map((image) => ({
              ...image,
              listing_id: listing.id,
            }))
          );

        if (imagesError) throw imagesError;
      }

      // Store form data before navigating
      store.setFormData(data);
      store.setImageUrls(imageUrls);
      store.setTitleImageIndex(titleImageIndex);
      
      // Clear form data
      form.reset();
      setImages([]);
      setImageUrls([]);
      setTitleImageIndex(0);

      navigate(`/listings/${listing.id}/preview`);
    } catch (error) {
      console.error('Error saving listing:', error);
      toast({
        title: mode === 'edit' ? 'Fehler beim Aktualisieren' : 'Fehler beim Erstellen',
        description: error instanceof Error ? error.message : 'Bitte versuchen Sie es später erneut',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDraft = async (data: ListingFormData) => {
    setIsSavingDraft(true);
    try {
      const location = {
        ...data.location,
        address: `${data.location.street} ${data.location.houseNumber}, ${data.location.zip} ${data.location.city}, ${data.location.canton}`
      };

      const submissionData = {
        ...data,
        location,
        auction_end_time: data.type === 'auction' ? data.auction_end_time : null,
        auction_start_price: data.type === 'auction' ? data.auction_start_price : null,
        auction_min_price: data.type === 'auction' ? data.auction_min_price : null,
        price: data.type === 'fixed_price' ? data.price : null,
        status: 'draft'
      };

      let listing;

      if (mode === 'edit' && id) {
        // Update existing listing
        const { data, error: updateError } = await supabase
          .from('listings')
          .update(submissionData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;
        listing = data;
      } else {
        // Create new listing
        const { data, error: createError } = await supabase
          .from('listings')
          .insert([{
            ...submissionData,
            user_id: '00000000-0000-0000-0000-000000000000',
          }])
          .select()
          .single();

        if (createError) throw createError;
        listing = data;
      }

      // Handle new images if there are any
      if (images.length > 0) {
        const imageUploads = images.map(async (file, index) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('listings')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('listings')
            .getPublicUrl(fileName);

          return {
            url: publicUrl,
            position: index,
            is_featured: index === titleImageIndex,
          };
        });

        const uploadedImages = await Promise.all(imageUploads);

        // Add new images to the listing
        const { error: imagesError } = await supabase
          .from('listing_images')
          .insert(
            uploadedImages.map((image) => ({
              ...image,
              listing_id: listing.id,
            }))
          );

        if (imagesError) throw imagesError;
      }

      toast({
        title: 'Entwurf gespeichert',
        description: mode === 'edit' ? 'Der Entwurf wurde aktualisiert.' : 'Ihr Inserat wurde als Entwurf gespeichert.',
      });

      navigate('/listings/my');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Fehler beim Speichern',
        description: 'Der Entwurf konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Inserat gelöscht',
        description: 'Das Inserat wurde erfolgreich gelöscht.',
      });

      navigate('/listings/my');
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast({
        title: 'Fehler beim Löschen',
        description: 'Das Inserat konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
    <Form {...form}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <ListingBasicInfoForm
          form={form}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        <div className="space-y-4">
          <FormLabel>Bilder</FormLabel>
          <ListingImageUpload
            images={images}
            setImages={setImages}
            imageUrls={imageUrls}
            setImageUrls={setImageUrls}
            titleImageIndex={titleImageIndex}
            setTitleImageIndex={setTitleImageIndex}
            isPremium={profile?.is_premium}
          />
        </div>

        <ListingPriceForm form={form} />

        <ListingLocationForm
          form={form}
          isLocating={isLocating}
          detectLocation={detectLocation}
        />

        <ListingOptionsForm form={form} />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (form.formState.isValid) {
                saveDraft(form.getValues());
              } else {
                form.trigger();
              }
            }}
            disabled={isSavingDraft || isSubmitting}
          >
            {isSavingDraft && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Als Entwurf speichern
          </Button>
          {mode === 'edit' && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Löschen
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => navigate('/')}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Vorschau
          </Button>
        </div>
      </form>
      )}
    </Form>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Inserat löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Diese Aktion kann nicht rückgängig gemacht werden. Das Inserat wird dauerhaft gelöscht.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}