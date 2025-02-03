/*
  # Update Storage Policies for Listings Bucket

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policies directly on storage.objects
    - Add more permissive policies for demo purposes
    - Remove folder name restrictions for easier testing

  2. Security
    - Allow public read access to all listing images
    - Allow anyone to upload/update/delete images in the listings bucket
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete images" ON storage.objects;

-- Create new, simplified policies directly on storage.objects
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'listings');

CREATE POLICY "Anyone can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listings'
  AND (LOWER(RIGHT(name, 4)) IN ('.jpg', '.png') OR LOWER(RIGHT(name, 5)) = '.webp')
);

CREATE POLICY "Anyone can update images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'listings');

CREATE POLICY "Anyone can delete images"
ON storage.objects FOR DELETE
USING (bucket_id = 'listings');