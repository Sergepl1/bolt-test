-- Add new listing statuses
ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'rejected';

-- Add rejection reason to listings
ALTER TABLE listings
ADD COLUMN rejection_reason text;

-- Create admin_users table
CREATE TABLE admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users
CREATE POLICY "Anyone can view admin users"
  ON admin_users FOR SELECT
  USING (true);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE id = user_id
  );
END;
$$;

-- Create function to approve listing
CREATE OR REPLACE FUNCTION approve_listing(listing_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can approve listings';
  END IF;

  -- Update listing status
  UPDATE listings
  SET 
    status = 'approved',
    published_at = now()
  WHERE id = listing_id_param
  AND status = 'pending';
END;
$$;

-- Create function to reject listing
CREATE OR REPLACE FUNCTION reject_listing(listing_id_param uuid, reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can reject listings';
  END IF;

  -- Update listing status
  UPDATE listings
  SET 
    status = 'rejected',
    rejection_reason = reason
  WHERE id = listing_id_param
  AND status = 'pending';
END;
$$;

-- Create function to get pending listings
CREATE OR REPLACE FUNCTION get_pending_listings()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  category text,
  price decimal,
  created_at timestamptz,
  user_id uuid,
  username text,
  images json
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can view pending listings';
  END IF;

  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    l.description,
    l.category,
    l.price,
    l.created_at,
    l.user_id,
    p.username,
    (
      SELECT json_agg(json_build_object(
        'url', li.url,
        'is_featured', li.is_featured
      ))
      FROM listing_images li
      WHERE li.listing_id = l.id
    ) as images
  FROM listings l
  JOIN profiles p ON p.id = l.user_id
  WHERE l.status = 'pending'
  ORDER BY l.created_at DESC;
END;
$$;