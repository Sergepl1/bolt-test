import { supabase } from './supabase';

// Default avatar URL - abstract user icon
export const DEFAULT_AVATAR_URL = "https://api.dicebear.com/7.x/avataaars/svg?backgroundColor=b6e3f4";

export async function checkEmailExists(email: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_email_exists', {
    email_to_check: email
  });
  
  if (error) throw error;
  return data;
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_username_exists', {
    username_to_check: username
  });
  
  if (error) throw error;
  return data;
}

export type SignUpData = {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
};

export type SignInData = {
  email: string;
  password: string;
};

export async function signUp(data: SignUpData) {
  // First check if username exists
  const usernameExists = await checkUsernameExists(data.username);
  if (usernameExists) {
    throw new Error('username_exists');
  }

  // Then check if email exists
  const emailExists = await checkEmailExists(data.email);
  if (emailExists) {
    throw new Error('email_exists');
  }

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/confirm`,
      data: {
        username: data.username,
        full_name: `${data.firstName} ${data.lastName}`,
        avatar_url: DEFAULT_AVATAR_URL,
      }
    },
  });

  if (error) {
    console.error('Signup error:', error);
    if (error.message.includes('already registered')) {
      throw new Error('email_exists');
    }
    throw error;
  }
  
  return authData;
}

export async function resendConfirmationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) throw error;
}

export async function isEmailConfirmed(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.email_confirmed || false;
}

export async function signIn({ email, password }: SignInData) {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      throw new Error('email_not_confirmed');
    }
    throw error;
  }

  return authData;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}