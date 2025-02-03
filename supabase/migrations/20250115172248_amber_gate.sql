/*
  # Fix profiles table relationships

  1. Changes
    - Remove foreign key constraint from profiles table
    - Add UUID validation constraint
    - Create demo user profile
    - Update policies to handle demo user

  2. Security
    - Maintain RLS policies
    - Allow demo user operations
*/

-- Remove any existing foreign key constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add a constraint that validates UUID format and allows demo user
ALTER TABLE profiles
ADD CONSTRAINT profiles_id_check
CHECK (
  id IS NOT NULL AND
  (id = '00000000-0000-0000-0000-000000000000' OR id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
);

-- Create demo user profile if it doesn't exist
INSERT INTO profiles (id, username, full_name)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Demo User',
  'Demo User'
)
ON CONFLICT (id) DO NOTHING;

-- Update policies to handle demo user
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own profile"
  ON profiles FOR ALL
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN id = '00000000-0000-0000-0000-000000000000'
      ELSE auth.uid() = id
    END
  );

-- Update the trigger function to handle demo user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url
  WHERE profiles.id != '00000000-0000-0000-0000-000000000000';
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);