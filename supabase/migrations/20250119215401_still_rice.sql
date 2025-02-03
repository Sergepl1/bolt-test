-- Drop existing function
DROP FUNCTION IF EXISTS approve_listing(uuid);

-- Create improved function to approve listings
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

  -- Update listing status to active
  UPDATE listings
  SET 
    status = 'active',
    published_at = now()
  WHERE id = listing_id_param
  AND status = 'pending';
END;
$$;