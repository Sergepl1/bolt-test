/*
  # Fix demo user handling

  1. Changes
    - Remove foreign key constraint for profiles table
    - Update policies to handle demo user
    - Add trigger to maintain data consistency

  2. Security
    - Maintain RLS policies
    - Allow demo user operations safely
*/

-- Remove the foreign key constraint from profiles
ALTER TABLE profiles
DROP CONSTRAINT profiles_id_fkey;

-- Add a new constraint that allows the demo user ID
ALTER TABLE profiles
ADD CONSTRAINT profiles_id_check
CHECK (
  id = '00000000-0000-0000-0000-000000000000'
  OR
  EXISTS (
    SELECT 1 FROM auth.users WHERE auth.users.id = profiles.id
  )
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
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow demo user operations" ON profiles;

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