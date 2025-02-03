import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Camera, Shield, Bell, Key, Loader2, X, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DEFAULT_AVATAR_URL } from '@/lib/auth';
import { checkEmailExists, checkUsernameExists } from '@/lib/auth';
import { RatingSummary } from '@/components/ratings/RatingSummary';
import { RatingsList } from '@/components/ratings/RatingsList';

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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

const cantons = [
  'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH'
];

const profileSchema = z.object({
  username: z.string()
    .min(3, "Benutzername muss mindestens 3 Zeichen lang sein")
    .max(20, "Benutzername darf maximal 20 Zeichen lang sein")
    .regex(/^[a-zA-Z0-9_-]+$/, "Benutzername darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten"),
  fullName: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  phone: z.string().optional(),
  street: z.string().optional(),
  houseNumber: z.string().optional(),
  zip: z.string()
    .regex(/^[0-9]{4}$/, 'Ungültige PLZ')
    .optional()
    .or(z.literal('')),
  city: z.string().optional(),
  canton: z.string().optional(),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
  }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const securitySchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
  newPassword: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

type SecurityFormData = z.infer<typeof securitySchema>;

export function ProfilePage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [ratingStats, setRatingStats] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userMetadata, setUserMetadata] = useState(user?.user_metadata || {});

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: userMetadata.username || '',
      fullName: userMetadata.full_name || '',
      email: user?.email || '',
      phone: userMetadata.phone || '',
      street: userMetadata.street || '',
      houseNumber: userMetadata.house_number || '',
      zip: userMetadata.zip || '',
      city: userMetadata.city || '',
      canton: userMetadata.canton || '',
      notifications: {
        email: true,
        push: true,
      },
    },
  });
  
  useEffect(() => {
    if (user) {
      setUserMetadata(user.user_metadata);
      fetchRatings();
      profileForm.reset({
        username: user.user_metadata.username || '',
        fullName: user.user_metadata.full_name || '',
        email: user.email || '',
        phone: user.user_metadata.phone || '',
        street: user.user_metadata.street || '',
        houseNumber: user.user_metadata.house_number || '',
        zip: user.user_metadata.zip || '',
        city: user.user_metadata.city || '',
        canton: user.user_metadata.canton || '',
        notifications: {
          email: true,
          push: true,
        },
      });
    }
  }, [user, profileForm]);

  const fetchRatings = async () => {
    if (!user) return;
    try {
      const { data: stats, error: statsError } = await supabase
        .rpc('get_user_ratings', { user_id: user.id });

      if (statsError) throw statsError;
      setRatingStats(stats);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const securityForm = useForm<SecurityFormData>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (authError) throw authError;

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Update local state
      setUserMetadata(prev => ({
        ...prev,
        avatar_url: publicUrl,
      }));

      toast({
        title: 'Profilbild aktualisiert',
        description: 'Ihr neues Profilbild wurde erfolgreich gespeichert.',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Fehler beim Hochladen',
        description: 'Das Profilbild konnte nicht aktualisiert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      // Only validate email if it has changed
      if (data.email !== user?.email) {
        const emailExists = await checkEmailExists(data.email);
        if (emailExists) {
          profileForm.setError('email', {
            type: 'manual',
            message: 'Diese E-Mail-Adresse wird bereits verwendet'
          });
          setIsSaving(false);
          return;
        }
      }

      // Only validate username if it has changed
      if (data.username !== user?.user_metadata.username) {
        const usernameExists = await checkUsernameExists(data.username);
        if (usernameExists) {
          profileForm.setError('username', {
            type: 'manual',
            message: 'Dieser Benutzername ist bereits vergeben'
          });
          setIsSaving(false);
          return;
        }
      }

      // Only validate email if it has changed
      if (data.email !== user?.email) {
        const emailExists = await checkEmailExists(data.email);
        if (emailExists) {
          profileForm.setError('email', {
            type: 'manual',
            message: 'Diese E-Mail-Adresse wird bereits verwendet'
          });
          setIsSaving(false);
          return;
        }
      }

      // Only validate username if it has changed
      if (data.username !== user?.user_metadata.username) {
        const usernameExists = await checkUsernameExists(data.username);
        if (usernameExists) {
          profileForm.setError('username', {
            type: 'manual',
            message: 'Dieser Benutzername ist bereits vergeben'
          });
          setIsSaving(false);
          return;
        }
      }

      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        email: data.email, 
        data: {
          username: data.username,
          full_name: data.fullName,
          avatar_url: user?.user_metadata.avatar_url,
        },
      });

      if (authError) throw authError;

      // Then update profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          full_name: data.fullName,
          phone: data.phone,
          street: data.street,
          house_number: data.houseNumber,
          zip: data.zip,
          city: data.city,
          canton: data.canton,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Update local state
      setUserMetadata(prev => ({
        ...prev,
        username: data.username,
        full_name: data.fullName,
        avatar_url: user?.user_metadata.avatar_url,
        phone: data.phone,
        street: data.street,
        house_number: data.houseNumber,
        zip: data.zip,
        city: data.city,
        canton: data.canton,
      }));

      toast({
        title: 'Profil aktualisiert',
        description: 'Ihre Änderungen wurden erfolgreich gespeichert.',
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Fehler beim Speichern',
        description: 'Ihre Änderungen konnten nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onSecuritySubmit = async (data: SecurityFormData) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Passwort aktualisiert',
        description: 'Ihr Passwort wurde erfolgreich geändert.',
      });

      securityForm.reset();
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: 'Fehler beim Ändern des Passworts',
        description: 'Das Passwort konnte nicht geändert werden.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      // Sign out first
      await supabase.auth.signOut();

      // Delete the user's account using RPC function
      const { error } = await supabase.rpc('delete_user_account', {
        user_id_param: user.id
      });
      
      if (error) throw error;

      toast({
        title: 'Konto gelöscht',
        description: 'Ihr Konto wurde erfolgreich gelöscht.',
      });

      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      // Try to sign in again if deletion fails
      await supabase.auth.signInWithPassword({
        email: user.email!,
        password: '' // This will fail but that's okay
      });
      
      toast({
        title: 'Fehler beim Löschen',
        description: 'Das Konto konnte nicht gelöscht werden. Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Profil Einstellungen</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-destructive/10"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="security">Sicherheit</TabsTrigger>
            <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
            <TabsTrigger value="danger" className="text-destructive">Gefahrenzone</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            {/* Avatar Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <img
                      src={user?.user_metadata.avatar_url || DEFAULT_AVATAR_URL}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // Fallback to default avatar if image fails to load
                        const img = e.target as HTMLImageElement;
                        img.src = DEFAULT_AVATAR_URL;
                      }}
                    />
                    <label
                      className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                      htmlFor="avatar-upload"
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </label>
                    <input
                      type="file"
                      id="avatar-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={isUploading}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{user?.user_metadata.username || user?.email}</h3>
                    <p className="text-sm text-muted-foreground">
                      Mitglied seit {new Date(user?.created_at || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="gap-2"
                >
                  {isEditing ? 'Abbrechen' : 'Bearbeiten'}
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Ratings Section */}
            {ratingStats && (
              <div className="mt-8 space-y-8">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Bewertungen</h2>
                  <RatingSummary
                    totalRatings={ratingStats.total_ratings}
                    avgCommunication={ratingStats.avg_communication}
                    avgReliability={ratingStats.avg_reliability}
                    avgOverall={ratingStats.avg_overall}
                  />
                </div>
                {ratingStats.total_ratings > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Letzte Bewertungen</h3>
                    <RatingsList ratings={ratingStats.recent_ratings} />
                  </div>
                )}
              </div>
            )}

            {/* Profile Form */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  {isEditing ? (
                    <>
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={profileForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Benutzername</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input {...field} className="pl-10" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vollständiger Name</FormLabel>
                              <FormControl>
                                <Input {...field} className="transition-all" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-Mail</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input {...field} type="email" className="pl-10" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefon</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    {...field} 
                                    type="tel" 
                                    className="pl-10"
                                    placeholder="Optional"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-4">Adresse</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-6">
                            <FormField
                              control={profileForm.control}
                              name="street"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Strasse</FormLabel>
                                  <FormControl>
                                    <div className="relative group">
                                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <Input {...field} className="pl-10" />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={profileForm.control}
                              name="zip"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>PLZ</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      maxLength={4} 
                                      className="transition-all"
                                      placeholder="Optional" 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="space-y-6">
                            <FormField
                              control={profileForm.control}
                              name="houseNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Hausnummer</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      className="transition-all"
                                      placeholder="Optional"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={profileForm.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Ort</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      className="transition-all"
                                      placeholder="Optional"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={profileForm.control}
                              name="canton"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Kanton</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Optional" />
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
                      </div>
                    </>
                  ) : (
                    <div className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Benutzername</h3>
                          <p className="text-lg">{userMetadata.username}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Name</h3>
                          <p className="text-lg">{userMetadata.full_name}</p>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">E-Mail</h3>
                          <p className="text-lg">{user?.email}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Telefon</h3>
                          <p className="text-lg">{userMetadata.phone || '-'}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-4">Adresse</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Strasse & Nr.</h4>
                            <p className="text-lg">
                              {userMetadata.street} {userMetadata.house_number}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">PLZ & Ort</h4>
                            <p className="text-lg">
                              {userMetadata.zip} {userMetadata.city}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Kanton</h4>
                            <p className="text-lg">{userMetadata.canton || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-4">
                    {isEditing && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            // Reset form to current user data
                            profileForm.reset({
                              username: user?.user_metadata.username || '',
                              fullName: user?.user_metadata.full_name || '',
                              email: user?.email || '',
                              phone: user?.user_metadata.phone || '',
                              street: user?.user_metadata.street || '',
                              houseNumber: user?.user_metadata.house_number || '',
                              zip: user?.user_metadata.zip || '',
                              city: user?.user_metadata.city || '',
                              canton: user?.user_metadata.canton || '',
                              notifications: {
                                email: true,
                                push: true,
                              },
                            });
                          }}
                        >
                          Abbrechen
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Speichern
                        </Button>
                      </>
                    )}
                  </div>
                </form>
              </Form>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                  <FormField
                    control={securityForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aktuelles Passwort</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} type="password" className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={securityForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Neues Passwort</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} type="password" className="pl-10" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Mindestens 8 Zeichen
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={securityForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passwort bestätigen</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} type="password" className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit">Passwort ändern</Button>
                </form>
              </Form>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Benachrichtigungen</h3>
                    <div className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="notifications.email"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>E-Mail-Benachrichtigungen</FormLabel>
                              <FormDescription>
                                Erhalten Sie Updates zu Ihren Inseraten und Nachrichten
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
                        control={profileForm.control}
                        name="notifications.push"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Push-Benachrichtigungen</FormLabel>
                              <FormDescription>
                                Erhalten Sie sofortige Benachrichtigungen im Browser
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
                  </div>

                  <Button type="submit">
                    Einstellungen speichern
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="danger">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-destructive">Konto löschen</h2>
                  <p className="text-muted-foreground mt-2">
                    Wenn Sie Ihr Konto löschen, werden alle Ihre Daten unwiderruflich gelöscht. Dies umfasst:
                  </p>
                  <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
                    <li>Ihr Profil und persönliche Informationen</li>
                    <li>Alle Ihre Inserate</li>
                    <li>Ihre Nachrichten und Konversationen</li>
                    <li>Ihre Favoriten und Bewertungen</li>
                  </ul>
                  <div className="mt-6">
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      Konto löschen
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Delete Account Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konto wirklich löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten werden permanent gelöscht.
                <br /><br />
                Wenn Sie fortfahren möchten, klicken Sie auf "Konto löschen".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Konto löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}