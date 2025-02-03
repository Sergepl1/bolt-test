/*
  # Fix profiles constraint

  1. Changes
    - Drop existing constraint before adding new one
    - Ensure demo user profile exists
    - Update policies to handle demo user properly

  2. Security
    - Maintain existing security policies
    - Ensure proper access control for demo user
*/

-- Drop existing constraint if it exists
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_id_check;

-- Add the constraint back
ALTER TABLE profiles
ADD CONSTRAINT profiles_id_check
CHECK (
  id IS NOT NULL AND
  (id = '00000000-0000-0000-0000-000000000000' OR id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
);

-- Ensure demo user profile exists
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

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);