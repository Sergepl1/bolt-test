/*
  # Add favorites functionality
  
  1. New Tables
    - `listing_favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `listing_id` (uuid, references listings)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `listing_favorites` table
    - Add policies for managing favorites
*/

-- Create favorites table
CREATE TABLE IF NOT EXISTS listing_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_favorite UNIQUE (listing_id, user_id)
);

-- Enable RLS
ALTER TABLE listing_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their favorites"
  ON listing_favorites FOR SELECT
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN user_id = '00000000-0000-0000-0000-000000000000'
      ELSE auth.uid() = user_id
    END
  );

CREATE POLICY "Users can manage their favorites"
  ON listing_favorites FOR ALL
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN user_id = '00000000-0000-0000-0000-000000000000'
      ELSE auth.uid() = user_id
    END
  );

-- Create indexes
CREATE INDEX idx_listing_favorites_user ON listing_favorites(user_id);
CREATE INDEX idx_listing_favorites_listing ON listing_favorites(listing_id);