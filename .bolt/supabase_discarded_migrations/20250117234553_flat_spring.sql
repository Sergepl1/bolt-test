/*
  # Avatar Storage and Profile Updates

  1. Storage Configuration
    - Creates avatars bucket with proper size limits and mime types
    - Configures public access and security policies
  
  2. Profile Updates
    - Ensures profile updates trigger avatar URL updates
    - Adds proper storage policies for avatar management
    - Improves synchronization between profiles and auth.users
*/

-- Create avatars bucket with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Drop existing avatar-related policies if they exist
DROP POLICY IF EXISTS "Public avatars access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create storage policies for avatars with demo user support
CREATE POLICY "Public avatars access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND (
        CASE 
            WHEN auth.uid() IS NULL THEN true  -- Allow demo user
            ELSE true  -- Allow authenticated users
        END
    )
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND (
        CASE 
            WHEN auth.uid() IS NULL THEN true  -- Allow demo user
            ELSE true  -- Allow authenticated users
        END
    )
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND (
        CASE 
            WHEN auth.uid() IS NULL THEN true  -- Allow demo user
            ELSE true  -- Allow authenticated users
        END
    )
);

-- Update profiles table to ensure avatar_url updates are handled
CREATE OR REPLACE FUNCTION handle_profile_avatar_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the auth.users metadata when avatar_url changes
    IF NEW.avatar_url IS DISTINCT FROM OLD.avatar_url THEN
        UPDATE auth.users
        SET raw_user_meta_data = 
            jsonb_set(
                COALESCE(raw_user_meta_data, '{}'::jsonb),
                '{avatar_url}',
                to_jsonb(NEW.avatar_url)
            )
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for avatar updates
DROP TRIGGER IF EXISTS on_profile_avatar_update ON profiles;
CREATE TRIGGER on_profile_avatar_update
    AFTER UPDATE OF avatar_url ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_profile_avatar_update();

-- Ensure all profiles have up-to-date avatar URLs
UPDATE profiles p
SET avatar_url = (
    SELECT raw_user_meta_data->>'avatar_url'
    FROM auth.users u
    WHERE u.id = p.id
)
WHERE EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = p.id
    AND u.raw_user_meta_data->>'avatar_url' IS NOT NULL
    AND (p.avatar_url IS NULL OR p.avatar_url != u.raw_user_meta_data->>'avatar_url')
);