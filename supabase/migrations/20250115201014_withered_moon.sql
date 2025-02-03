/*
  # Add delete functionality for favorites
  
  1. Add delete policy for favorites
    - Allow users to delete their own favorites
    - Allow demo user to delete their favorites
*/

-- Add delete policy for favorites
DROP POLICY IF EXISTS "Users can delete their favorites" ON listing_favorites;

CREATE POLICY "Users can delete their favorites"
  ON listing_favorites FOR DELETE
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN user_id = '00000000-0000-0000-0000-000000000000'
      ELSE auth.uid() = user_id
    END
  );

-- Add policy for updating favorites
DROP POLICY IF EXISTS "Users can update their favorites" ON listing_favorites;

CREATE POLICY "Users can update their favorites"
  ON listing_favorites FOR UPDATE
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN user_id = '00000000-0000-0000-0000-000000000000'
      ELSE auth.uid() = user_id
    END
  );

-- Create function to count favorites
CREATE OR REPLACE FUNCTION get_favorite_count(listing_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)
  FROM listing_favorites
  WHERE listing_id = $1;
$$;