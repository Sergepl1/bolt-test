/*
  # Fix storage policies for anonymous uploads

  1. Changes
    - Allow anonymous uploads to the listings bucket
    - Remove authentication requirements
    - Keep public access for viewing images
*/

-- Update the insert policy to allow anonymous uploads
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;

CREATE POLICY "Anyone can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'listings');

-- Update update/delete policies to be more permissive for demo purposes
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

CREATE POLICY "Anyone can update images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'listings');

CREATE POLICY "Anyone can delete images"
ON storage.objects FOR DELETE
USING (bucket_id = 'listings');