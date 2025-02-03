/*
  # Configure storage for listings

  1. Storage Setup
    - Enable storage extension
    - Create listings bucket
    - Configure public access

  2. Security
    - Add policies for public access and image management
*/


-- Create listings bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'listings');

CREATE POLICY "Anyone can upload images"
ON storage.objects FOR INSERT
WITH CHECK ((bucket_id = 'listings'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1]));

CREATE POLICY "Anyone can update images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'listings');

CREATE POLICY "Anyone can delete images"
ON storage.objects FOR DELETE
USING (bucket_id = 'listings');