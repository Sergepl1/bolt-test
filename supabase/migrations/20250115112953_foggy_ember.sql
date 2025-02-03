/*
  # Fix Storage Configuration

  1. Changes
    - Enable storage extension
    - Create listings bucket with proper configuration
    - Update storage policies
*/

-- Enable storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA "extensions";

-- Create listings bucket with proper configuration
DO $$
BEGIN
    -- Create the bucket if it doesn't exist
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'listings',
        'listings',
        true,
        5242880, -- 5MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp']
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        public = true,
        file_size_limit = 5242880,
        allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

    -- Ensure the bucket exists before creating policies
    DELETE FROM storage.policies WHERE bucket_id = 'listings';

    -- Recreate policies
    INSERT INTO storage.policies (name, bucket_id, operation, definition)
    VALUES
        ('Public Access', 'listings', 'SELECT', '(bucket_id = ''listings''::text)'),
        ('Anyone can upload images', 'listings', 'INSERT', '(bucket_id = ''listings''::text)'),
        ('Anyone can update images', 'listings', 'UPDATE', '(bucket_id = ''listings''::text)'),
        ('Anyone can delete images', 'listings', 'DELETE', '(bucket_id = ''listings''::text)');
END $$;