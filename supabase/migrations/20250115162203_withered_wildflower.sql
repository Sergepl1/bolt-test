/*
  # Add instant buy option to listings

  1. Changes
    - Add `allow_instant_buy` column to listings table
    - Add default value of false
    - Add migration for existing records

  2. Security
    - No changes to RLS policies needed
*/

-- Add instant buy option to listings
ALTER TABLE listings
ADD COLUMN allow_instant_buy boolean DEFAULT false;

-- Update existing records
UPDATE listings
SET allow_instant_buy = false
WHERE allow_instant_buy IS NULL;