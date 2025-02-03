-- Add condition column to listings table
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS condition text CHECK (condition IN ('new', 'used')) DEFAULT 'used';

-- Create index for condition
CREATE INDEX IF NOT EXISTS idx_listings_condition ON listings(condition);

-- Update existing listings to have a condition
UPDATE listings SET condition = 'used' WHERE condition IS NULL;

-- Make condition required
ALTER TABLE listings ALTER COLUMN condition SET NOT NULL;