/*
  # Fix rating policy conflict

  1. Changes
    - Drop existing rating policy
    - Recreate rating policy with proper checks
    - Add missing indexes for better performance
*/

-- Drop existing rating policy
DROP POLICY IF EXISTS "Anyone can view ratings" ON ratings;

-- Create new rating policy
CREATE POLICY "Anyone can view ratings"
  ON ratings FOR SELECT
  USING (true);

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ratings_rated_user 
  ON ratings(rated_id);
CREATE INDEX IF NOT EXISTS idx_ratings_transaction 
  ON ratings(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at 
  ON ratings(created_at DESC);