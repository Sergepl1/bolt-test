/*
  # Fix Profile Synchronization

  1. Updates
    - Fix ambiguous column references in sync queries
    - Improve sync between profiles and auth.users
    - Update sync function to use explicit table references
  
  2. Changes
    - Use explicit table aliases in all queries
    - Fix COALESCE statements to avoid ambiguity
*/

-- Update sync function to handle all profile fields properly with explicit references
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

-- Create or replace trigger for profile updates
DROP TRIGGER IF EXISTS on_profile_update ON profiles;
CREATE TRIGGER on_profile_update
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_auth();

-- Sync existing profiles to auth metadata with explicit table references
UPDATE auth.users AS u
SET raw_user_meta_data = jsonb_build_object(
  'username', p.username,
  'full_name', p.full_name,
  'avatar_url', p.avatar_url,
  'phone', p.phone,
  'street', p.street,
  'house_number', p.house_number,
  'zip', p.zip,
  'city', p.city,
  'canton', p.canton
)
FROM profiles AS p
WHERE u.id = p.id;

-- Sync auth metadata to profiles with explicit table references
UPDATE profiles AS p
SET
  username = COALESCE(CAST(u.raw_user_meta_data->>'username' AS text), p.username),
  full_name = COALESCE(CAST(u.raw_user_meta_data->>'full_name' AS text), p.full_name),
  avatar_url = COALESCE(CAST(u.raw_user_meta_data->>'avatar_url' AS text), p.avatar_url),
  phone = COALESCE(CAST(u.raw_user_meta_data->>'phone' AS text), p.phone),
  street = COALESCE(CAST(u.raw_user_meta_data->>'street' AS text), p.street),
  house_number = COALESCE(CAST(u.raw_user_meta_data->>'house_number' AS text), p.house_number),
  zip = COALESCE(CAST(u.raw_user_meta_data->>'zip' AS text), p.zip),
  city = COALESCE(CAST(u.raw_user_meta_data->>'city' AS text), p.city),
  canton = COALESCE(CAST(u.raw_user_meta_data->>'canton' AS text), p.canton)
FROM auth.users AS u
WHERE p.id = u.id;