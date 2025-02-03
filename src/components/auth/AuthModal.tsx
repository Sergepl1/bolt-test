import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Apple, Github, Link as LinkIcon } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

import {
  Dialog,
  DialogContent,
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { signIn, signUp, checkEmailExists, resetPassword, signInWithGoogle } from '@/lib/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';

const forgotPasswordSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
});

const signUpSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z
    .string().min(1, 'Passwort ist erforderlich')
    .min(8, "Passwort muss mindestens 8 Zeichen lang sein")
    .regex(/[A-Z]/, "Passwort muss mindestens einen Großbuchstaben enthalten")
    .regex(/[a-z]/, "Passwort muss mindestens einen Kleinbuchstaben enthalten")
    .regex(/[0-9]/, "Passwort muss mindestens eine Zahl enthalten")
    .regex(/[^A-Za-z0-9]/, "Passwort muss mindestens ein Sonderzeichen enthalten"),
  confirmPassword: z.string().min(1, 'Passwort-Bestätigung ist erforderlich'),
  username: z.string()
    .min(3, "Benutzername muss mindestens 3 Zeichen lang sein")
    .max(20, "Benutzername darf maximal 20 Zeichen lang sein")
    .regex(/^[a-zA-Z0-9_-]+$/, "Benutzername darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten"),
  firstName: z.string().min(2, "Vorname muss mindestens 2 Zeichen lang sein"),
  lastName: z.string().min(2, "Nachname muss mindestens 2 Zeichen lang sein"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "Sie müssen die AGB und Datenschutzerklärung akzeptieren",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'E-Mail ist erforderlich')
    .email('Ungültige E-Mail-Adresse')
    .refine(async (email) => {
      try {
        const exists = await checkEmailExists(email);
        return exists;
      } catch (error) {
        return false;
      }
    }, 'Diese E-Mail-Adresse ist nicht registriert'),
  password: z
    .string()
    .min(1, 'Passwort ist erforderlich')
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
});

type SignUpFormData = z.infer<typeof signUpSchema>;
type SignInFormData = z.infer<typeof signInSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const cantons = [
  'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR',
  'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG',
  'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH'
];

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      firstName: '',
      lastName: '',
      termsAccepted: false,
    },
    mode: 'onBlur',
  });

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Google sign in error:', error);
      toast({
        title: 'Fehler bei der Google-Anmeldung',
        description: 'Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
    }
  };

  const onSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      // Validate terms acceptance
      if (!data.termsAccepted) {
        signUpForm.setError('termsAccepted', {
          type: 'manual',
          message: 'Sie müssen die AGB und Datenschutzerklärung akzeptieren'
        });
        setIsLoading(false);
        return;
      }

      // Create sign-up data
      const signUpData: SignUpData = {
        email: data.email,
        password: data.password,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
      };

      await signUp(signUpData);
      toast({
        title: 'Willkommen bei Swoppa!',
        description: 'Sie wurden erfolgreich registriert. Bitte bestätigen Sie Ihre E-Mail-Adresse um alle Funktionen nutzen zu können.',
      });
      
      navigate('/');
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Signup error:', error);
      let errorMessage = 'Bitte versuchen Sie es später erneut.';
      let fieldError = null;
      
      if (error instanceof Error) {
        if (error.message === 'email_exists') {
          errorMessage = 'Diese E-Mail-Adresse wird bereits verwendet.';
          fieldError = { field: 'email', message: errorMessage };
        } else if (error.message === 'username_exists') {
          errorMessage = 'Dieser Benutzername ist bereits vergeben.';
          fieldError = { field: 'username', message: errorMessage };
        } else if (error.message.includes('unexpected_failure')) {
          errorMessage = 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
        }
      }
      
      if (fieldError) {
        signUpForm.setError(fieldError.field as any, {
          type: 'manual',
          message: fieldError.message
        });
      }
      
      toast({
        title: 'Fehler bei der Registrierung',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    try {
      await signIn(data);
      toast({
        title: 'Erfolgreich angemeldet',
      });
      navigate('/');
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Sign in error:', error);
      let errorMessage = 'Bitte überprüfen Sie Ihre Anmeldedaten.';
      
      if (error instanceof Error && error.message === 'email_not_confirmed') {
        signInForm.setError('email', {
          type: 'manual',
          message: 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.'
        });
        toast({
          title: 'E-Mail nicht bestätigt',
          description: 'Bitte prüfen Sie Ihren Posteingang und klicken Sie auf den Bestätigungslink.',
          variant: 'destructive',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resendConfirmationEmail(data.email);
                toast({
                  title: 'E-Mail gesendet',
                  description: 'Eine neue Bestätigungs-E-Mail wurde an Ihre Adresse gesendet.',
                });
              }}
            >
              Erneut senden
            </Button>
          ),
          duration: 10000,
        });
        return;
      } else if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Falsches Passwort';
          signInForm.setError('password', {
            type: 'manual',
            message: 'Falsches Passwort'
          });
        }
      }
      
      toast({
        title: 'Anmeldung fehlgeschlagen',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await resetPassword(data.email);
      toast({
        title: 'E-Mail gesendet',
        description: 'Eine E-Mail mit Anweisungen zum Zurücksetzen des Passworts wurde gesendet.',
      });
      setShowForgotPassword(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: 'Fehler',
        description: 'Die E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Willkommen bei Swoppa</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Melde dich an oder erstelle einen Account, um loszulegen.
          </p>
        </DialogHeader>

        {showForgotPassword ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForgotPassword(false)}
                className="p-0 h-auto hover:bg-transparent -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
              <h3 className="text-lg font-semibold">Passwort zurücksetzen</h3>
            </div>
            <Form {...forgotPasswordForm}>
              <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)} className="space-y-6">
                <FormField
                  control={forgotPasswordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">E-Mail</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage className="text-sm text-destructive mt-1 absolute" />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Link zum Zurücksetzen senden
                </Button>
              </form>
            </Form>
          </>
        ) : (
          <Tabs defaultValue="sign-in" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sign-in">Anmelden</TabsTrigger>
            <TabsTrigger value="sign-up">Registrieren</TabsTrigger>
          </TabsList>

          <TabsContent value="sign-in">
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
              >
                <FcGoogle className="mr-2 h-5 w-5" />
                Mit Google anmelden
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Oder
                  </span>
                </div>
              </div>

              <Form {...signInForm}>
                <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-6">
                  <FormField
                    control={signInForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">E-Mail</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage className="text-sm text-destructive mt-1 absolute" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signInForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Passwort</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage className="text-sm text-destructive mt-1 absolute" />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="link"
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="px-0 h-auto text-sm"
                    >
                      Passwort vergessen?
                    </Button>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Anmelden
                  </Button>
                </form>
              </Form>
            </div>
          </TabsContent>

          <TabsContent value="sign-up">
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
              >
                <FcGoogle className="mr-2 h-5 w-5" />
                Mit Google registrieren
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Oder
                  </span>
                </div>
              </div>

              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-6">
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">E-Mail</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage className="text-sm text-destructive mt-1 absolute" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Passwort</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage className="text-sm text-destructive mt-1 absolute" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signUpForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Passwort bestätigen</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage className="text-sm text-destructive mt-1 absolute" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signUpForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Benutzername</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage className="text-sm text-destructive mt-1 absolute" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signUpForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Vorname</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Max" />
                        </FormControl>
                        <FormMessage className="text-sm text-destructive mt-1 absolute" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signUpForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Nachname</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Mustermann" />
                        </FormControl>
                        <FormMessage className="text-sm text-destructive mt-1 absolute" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signUpForm.control}
                    name="termsAccepted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start gap-2">
                        <FormControl className="mt-1">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div>
                          <FormLabel className="text-xs">
                            Ich habe die{' '}
                            <Link to="/terms" className="text-primary hover:underline" target="_blank">
                              AGB
                            </Link>
                            {' '}und die{' '}
                            <Link to="/privacy" className="text-primary hover:underline" target="_blank">
                              Datenschutzerklärung
                            </Link>
                            {' '}gelesen und akzeptiere sie
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrieren
                  </Button>
                </form>
              </Form>
            </div>
          </TabsContent>
        </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}