/*
  # Fix profile creation and add demo user

  1. Changes
    - Add demo user profile for testing
    - Add trigger to create profile on user creation
    - Add policy to allow profile creation for demo user

  2. Security
    - Maintain RLS policies
    - Allow demo user operations
*/

-- Create demo user profile if it doesn't exist
INSERT INTO profiles (id, username, full_name)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Demo User',
  'Demo User'
)
ON CONFLICT (id) DO NOTHING;

-- Update policies to allow demo user
CREATE POLICY "Allow demo user operations"
  ON profiles
  FOR ALL
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN id = '00000000-0000-0000-0000-000000000000'
      ELSE auth.uid() = id
    END
  );

-- Create or replace the trigger function
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
    avatar_url = EXCLUDED.avatar_url;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;