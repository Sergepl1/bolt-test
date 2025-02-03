/*
  # Add Profile Fields Migration

  1. Schema Updates
    - Add missing fields to profiles table (phone, address fields)
    - Add constraints and defaults
  
  2. Data Migration
    - Sync existing data from auth.users metadata
    - Update trigger function to handle new fields
*/

-- Add missing columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS street text,
ADD COLUMN IF NOT EXISTS house_number text,
ADD COLUMN IF NOT EXISTS zip text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS canton text;

-- Update existing profiles with data from auth metadata
UPDATE profiles p
SET
  phone = CAST(u.raw_user_meta_data->>'phone' AS text),
  street = CAST(u.raw_user_meta_data->>'street' AS text),
  house_number = CAST(u.raw_user_meta_data->>'house_number' AS text),
  zip = CAST(u.raw_user_meta_data->>'zip' AS text),
  city = CAST(u.raw_user_meta_data->>'city' AS text),
  canton = CAST(u.raw_user_meta_data->>'canton' AS text)
FROM auth.users u
WHERE p.id = u.id
AND u.raw_user_meta_data IS NOT NULL;

-- Update the trigger function to handle all profile fields
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    avatar_url,
    phone,
    street,
    house_number,
    zip,
    city,
    canton
  ) VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'street',
    new.raw_user_meta_data->>'house_number',
    new.raw_user_meta_data->>'zip',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'canton'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    phone = EXCLUDED.phone,
    street = EXCLUDED.street,
    house_number = EXCLUDED.house_number,
    zip = EXCLUDED.zip,
    city = EXCLUDED.city,
    canton = EXCLUDED.canton,
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to sync profile updates back to auth metadata
CREATE OR REPLACE FUNCTION sync_profile_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object(
    'username', NEW.username,
    'full_name', NEW.full_name,
    'avatar_url', NEW.avatar_url,
    'phone', NEW.phone,
    'street', NEW.street,
    'house_number', NEW.house_number,
    'zip', NEW.zip,
    'city', NEW.city,
    'canton', NEW.canton
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for syncing profile updates
DROP TRIGGER IF EXISTS on_profile_update ON profiles;
CREATE TRIGGER on_profile_update
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_auth();