-- Drop existing condition column if it exists
ALTER TABLE listings DROP COLUMN IF EXISTS condition;

-- Add condition column with proper constraints
ALTER TABLE listings
ADD COLUMN condition text CHECK (condition IN ('new', 'used')) DEFAULT 'used' NOT NULL;

-- Create index for condition
CREATE INDEX IF NOT EXISTS idx_listings_condition ON listings(condition);

-- Update existing listings to have a condition
UPDATE listings SET condition = 'used' WHERE condition IS NULL;