-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON listings;
DROP POLICY IF EXISTS "Users can manage their own listings" ON listings;
DROP POLICY IF EXISTS "Anyone can create listings" ON listings;

-- Create new policies for listings
CREATE POLICY "Anyone can view active listings"
  ON listings FOR SELECT
  USING (status = 'active');

CREATE POLICY "Anyone can create listings"
  ON listings FOR INSERT
  WITH CHECK (
    CASE 
      WHEN auth.uid() IS NULL THEN 
        user_id = '00000000-0000-0000-0000-000000000000'
      ELSE 
        user_id = auth.uid()
    END
  );

CREATE POLICY "Users can manage their own listings"
  ON listings FOR UPDATE
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN 
        user_id = '00000000-0000-0000-0000-000000000000'
      ELSE 
        auth.uid() = user_id
    END
  );

CREATE POLICY "Users can delete their own listings"
  ON listings FOR DELETE
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN 
        user_id = '00000000-0000-0000-0000-000000000000'
      ELSE 
        auth.uid() = user_id
    END
  );

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_user_status 
  ON listings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_listings_category_status 
  ON listings(category, status);
CREATE INDEX IF NOT EXISTS idx_listings_price 
  ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_created_at 
  ON listings(created_at DESC);