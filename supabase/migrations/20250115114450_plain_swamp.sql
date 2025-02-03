/*
  # Add policy for anonymous listing creation

  1. Changes
    - Add new RLS policy to allow anonymous users to create listings
    - This is temporary for demo purposes and should be removed in production
*/

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Anyone can create listings" ON listings;

-- Create a new policy that allows anyone to create listings
CREATE POLICY "Anyone can create listings"
  ON listings
  FOR INSERT
  WITH CHECK (true);

-- Update the existing policy to allow management of created listings
DROP POLICY IF EXISTS "Users can manage their own listings" ON listings;
CREATE POLICY "Users can manage their own listings"
  ON listings
  FOR ALL
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN user_id = '00000000-0000-0000-0000-000000000000'
      ELSE auth.uid() = user_id
    END
  );