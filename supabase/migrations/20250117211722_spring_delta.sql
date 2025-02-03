/*
  # Fix RLS policies for listings and storage

  1. Changes
    - Update storage policies to allow image uploads
    - Update listings policies to allow creation by anyone
    - Add policies for demo user support

  2. Security
    - Maintain security while allowing necessary operations
    - Support both authenticated and demo users
*/

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete images" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'listings');

CREATE POLICY "Anyone can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'listings');

CREATE POLICY "Anyone can update images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'listings');

CREATE POLICY "Anyone can delete images"
ON storage.objects FOR DELETE
USING (bucket_id = 'listings');

-- Drop existing listings policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON listings;
DROP POLICY IF EXISTS "Users can manage their own listings" ON listings;
DROP POLICY IF EXISTS "Anyone can create listings" ON listings;

-- Create new listings policies
CREATE POLICY "Anyone can view active listings"
  ON listings FOR SELECT
  USING (status = 'active');

CREATE POLICY "Anyone can create listings"
  ON listings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can manage their own listings"
  ON listings FOR ALL
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN user_id = '00000000-0000-0000-0000-000000000000'
      ELSE auth.uid() = user_id
    END
  );