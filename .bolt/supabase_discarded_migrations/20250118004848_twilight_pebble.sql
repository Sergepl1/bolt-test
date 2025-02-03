-- Add foreign key constraint for user_id in listings table
ALTER TABLE listings
DROP CONSTRAINT IF EXISTS listings_user_id_fkey;

ALTER TABLE listings
ADD CONSTRAINT listings_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Update the listings query in ListingDetail component to join with profiles
CREATE OR REPLACE FUNCTION get_listing_with_seller(listing_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  listing_data json;
BEGIN
  SELECT json_build_object(
    'listing', l.*,
    'listing_images', (
      SELECT json_agg(li.*)
      FROM listing_images li
      WHERE li.listing_id = l.id
    ),
    'seller', json_build_object(
      'id', p.id,
      'username', p.username,
      'avatar_url', p.avatar_url
    )
  ) INTO listing_data
  FROM listings l
  LEFT JOIN profiles p ON p.id = l.user_id
  WHERE l.id = listing_id;

  RETURN listing_data;
END;
$$;