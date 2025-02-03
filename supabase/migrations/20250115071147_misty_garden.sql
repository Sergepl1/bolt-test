/*
  # Create Listings System Tables

  1. New Tables
    - `listings`
      - Core listing information (title, description, price, etc.)
      - Supports multiple listing types (fixed price, auction)
      - Location tracking
      - Status management
    - `listing_images`
      - Stores image URLs and metadata
      - Supports ordering and featured image
    - `listing_views`
      - Tracks view statistics
    - `listing_drafts`
      - Autosave functionality for listings in progress
    - `listing_favorites`
      - Tracks user favorites/watchlist

  2. Security
    - Enable RLS on all tables
    - Policies for:
      - Listings: Users can read all active listings, but only edit their own
      - Images: Same access pattern as listings
      - Views: Anyone can create, owners can read
      - Drafts: Only owner access
      - Favorites: Personal access only
*/

-- Create enum for listing types
CREATE TYPE listing_type AS ENUM ('fixed_price', 'auction');

-- Create enum for listing status
CREATE TYPE listing_status AS ENUM ('draft', 'active', 'ended', 'sold', 'inactive');

-- Main listings table
CREATE TABLE listings (
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

-- Images table with ordering
CREATE TABLE listing_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  url text NOT NULL,
  position int NOT NULL,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_position UNIQUE (listing_id, position)
);

-- View tracking
CREATE TABLE listing_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now()
);

-- Drafts for autosave
CREATE TABLE listing_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content jsonb NOT NULL,
  last_saved_at timestamptz DEFAULT now(),
  
  CONSTRAINT one_draft_per_user UNIQUE (user_id)
);

-- Favorites/watchlist
CREATE TABLE listing_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_favorite UNIQUE (listing_id, user_id)
);

-- Enable RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_favorites ENABLE ROW LEVEL SECURITY;

-- Listings policies
CREATE POLICY "Anyone can view active listings"
  ON listings FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can manage their own listings"
  ON listings FOR ALL
  USING (auth.uid() = user_id);

-- Images policies
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

-- Views policies
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

-- Drafts policies
CREATE POLICY "Users can manage their drafts"
  ON listing_drafts FOR ALL
  USING (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "Users can manage their favorites"
  ON listing_favorites FOR ALL
  USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION increment_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE listings
  SET view_count = view_count + 1
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER after_view_insert
  AFTER INSERT ON listing_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_view_count();

-- Indexes
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listing_images_listing_id ON listing_images(listing_id);
CREATE INDEX idx_listing_views_listing_id ON listing_views(listing_id);
CREATE INDEX idx_listing_favorites_user_id ON listing_favorites(user_id);