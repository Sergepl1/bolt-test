/*
  # Add tables and RLS configuration

  1. Tables
    - listings (main listings table)
    - listing_images (for image management)
    - listing_views (for tracking views)
    - listing_favorites (for user favorites)
    - listing_drafts (for autosave functionality)

  2. Security
    - Enable RLS on all tables
    - Add policies for data access control
*/

-- Create enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE listing_type AS ENUM ('fixed_price', 'auction');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE listing_status AS ENUM ('draft', 'active', 'ended', 'sold', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  type listing_type NOT NULL,
  price decimal(10,2),
  auction_start_price decimal(10,2),
  auction_min_price decimal(10,2),
  auction_end_time timestamptz,
  location jsonb NOT NULL,
  allow_trade boolean DEFAULT false,
  shipping_available boolean DEFAULT false,
  status listing_status DEFAULT 'draft',
  view_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz,
  
  CONSTRAINT valid_price CHECK (
    (type = 'fixed_price' AND price IS NOT NULL) OR
    (type = 'auction' AND auction_start_price IS NOT NULL)
  )
);

-- Create listing images table
CREATE TABLE IF NOT EXISTS listing_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  url text NOT NULL,
  position int NOT NULL,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_position UNIQUE (listing_id, position)
);

-- Create listing views table
CREATE TABLE IF NOT EXISTS listing_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now()
);

-- Create listing drafts table
CREATE TABLE IF NOT EXISTS listing_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content jsonb NOT NULL,
  last_saved_at timestamptz DEFAULT now(),
  
  CONSTRAINT one_draft_per_user UNIQUE (user_id)
);

-- Create listing favorites table
CREATE TABLE IF NOT EXISTS listing_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_favorite UNIQUE (listing_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for listings
CREATE POLICY "Anyone can view active listings"
  ON listings FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can manage their own listings"
  ON listings FOR ALL
  USING (auth.uid() = user_id);

-- Create policies for images
CREATE POLICY "Anyone can view listing images"
  ON listing_images FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their listing images"
  ON listing_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_images.listing_id
      AND listings.user_id = auth.uid()
    )
  );

-- Create policies for views
CREATE POLICY "Anyone can create views"
  ON listing_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their listing stats"
  ON listing_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_views.listing_id
      AND listings.user_id = auth.uid()
    )
  );

-- Create policies for drafts
CREATE POLICY "Users can manage their drafts"
  ON listing_drafts FOR ALL
  USING (auth.uid() = user_id);

-- Create policies for favorites
CREATE POLICY "Users can manage their favorites"
  ON listing_favorites FOR ALL
  USING (auth.uid() = user_id);

-- Create function for view counting
CREATE OR REPLACE FUNCTION increment_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE listings
  SET view_count = view_count + 1
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for view counting
CREATE TRIGGER after_view_insert
  AFTER INSERT ON listing_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_view_count();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id ON listing_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_favorites_user_id ON listing_favorites(user_id);