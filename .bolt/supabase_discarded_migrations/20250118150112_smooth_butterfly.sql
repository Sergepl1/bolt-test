/*
  # Add Listing Boost System

  1. New Tables
    - `listing_boosts`
      - `id` (uuid, primary key)
      - `listing_id` (uuid, references listings)
      - `user_id` (uuid, references auth.users)
      - `starts_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
      - `status` (enum: active, expired)

  2. Changes
    - Add `is_boosted` column to listings table
    - Add function to automatically update listing boost status
    - Add function to check if a listing is currently boosted

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies for boost management
*/

-- Create boost status enum
CREATE TYPE boost_status AS ENUM ('active', 'expired');

-- Create listing_boosts table
CREATE TABLE listing_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  status boost_status NOT NULL DEFAULT 'active',

  CONSTRAINT valid_boost_period CHECK (expires_at > starts_at)
);

-- Add is_boosted column to listings
ALTER TABLE listings
ADD COLUMN is_boosted boolean DEFAULT false;

-- Enable RLS
ALTER TABLE listing_boosts ENABLE ROW LEVEL SECURITY;

-- Create policies for listing_boosts
CREATE POLICY "Anyone can view listing boosts"
  ON listing_boosts FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own boosts"
  ON listing_boosts FOR ALL
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN 
        user_id = '00000000-0000-0000-0000-000000000000'
      ELSE 
        auth.uid() = user_id
    END
  );

-- Create function to update boost status
CREATE OR REPLACE FUNCTION update_boost_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the boost status if expired
  IF NEW.expires_at <= NOW() THEN
    NEW.status := 'expired';
  END IF;

  -- Update the listing's is_boosted flag
  UPDATE listings
  SET is_boosted = EXISTS (
    SELECT 1
    FROM listing_boosts
    WHERE listing_id = NEW.listing_id
    AND status = 'active'
    AND now() BETWEEN starts_at AND expires_at
  )
  WHERE id = NEW.listing_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for boost status updates
CREATE TRIGGER on_boost_update
  BEFORE INSERT OR UPDATE ON listing_boosts
  FOR EACH ROW
  EXECUTE FUNCTION update_boost_status();

-- Create function to check if a listing is currently boosted
CREATE OR REPLACE FUNCTION is_listing_boosted(listing_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM listing_boosts
    WHERE listing_boosts.listing_id = $1
    AND status = 'active'
    AND now() BETWEEN starts_at AND expires_at
  );
$$;

-- Create indexes for better performance
CREATE INDEX idx_listing_boosts_listing_id ON listing_boosts(listing_id);
CREATE INDEX idx_listing_boosts_user_id ON listing_boosts(user_id);
CREATE INDEX idx_listing_boosts_status ON listing_boosts(status);
CREATE INDEX idx_listing_boosts_dates ON listing_boosts(starts_at, expires_at);