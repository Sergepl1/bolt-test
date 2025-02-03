-- Drop existing function
DROP FUNCTION IF EXISTS get_pending_listings();

-- Create improved function to get pending listings with user details
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
  user_details jsonb,
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
    jsonb_build_object(
      'username', p.username,
      'full_name', p.full_name,
      'email', u.email,
      'phone', p.phone,
      'street', p.street,
      'house_number', p.house_number,
      'zip', p.zip,
      'city', p.city,
      'canton', p.canton,
      'created_at', p.created_at
    ) as user_details,
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
  JOIN auth.users u ON u.id = l.user_id
  WHERE l.status = 'pending'
  ORDER BY l.created_at DESC;
END;
$$;