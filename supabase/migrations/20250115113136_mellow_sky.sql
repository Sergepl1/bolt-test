/*
  # Storage Policies for Listings Bucket

  1. Changes
    - Add storage policies for the listings bucket
    - Configure file size limits and allowed MIME types
*/

-- Update bucket configuration
UPDATE storage.buckets
SET file_size_limit = 5242880, -- 5MB limit
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'listings';

-- Ensure no duplicate policies
DELETE FROM storage.policies WHERE bucket_id = 'listings';

-- Create storage policies
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES
    ('Public Access', 'listings', 'SELECT', '(bucket_id = ''listings''::text)'),
    ('Anyone can upload images', 'listings', 'INSERT', '(bucket_id = ''listings''::text)'),
    ('Anyone can update images', 'listings', 'UPDATE', '(bucket_id = ''listings''::text)'),
    ('Anyone can delete images', 'listings', 'DELETE', '(bucket_id = ''listings''::text)');