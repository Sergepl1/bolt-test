-- Add terms acceptance tracking to profiles
ALTER TABLE profiles
ADD COLUMN terms_accepted_at timestamptz,
ADD COLUMN terms_version text,
ADD COLUMN privacy_accepted_at timestamptz,
ADD COLUMN privacy_version text;

-- Create terms versions table for tracking
CREATE TABLE terms_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('terms', 'privacy')),
  version text NOT NULL,
  content text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_version UNIQUE (type, version)
);

-- Enable RLS
ALTER TABLE terms_versions ENABLE ROW LEVEL SECURITY;

-- Create policy for terms versions
CREATE POLICY "Anyone can view terms versions"
  ON terms_versions FOR SELECT
  USING (true);

-- Create indexes
CREATE INDEX idx_terms_versions_type_version ON terms_versions(type, version);
CREATE INDEX idx_terms_versions_published_at ON terms_versions(published_at DESC);

-- Insert initial versions
INSERT INTO terms_versions (type, version, content, published_at)
VALUES 
  ('terms', '1.0', 'Initial terms of service', '2025-01-01T00:00:00Z'),
  ('privacy', '1.0', 'Initial privacy policy', '2025-01-01T00:00:00Z');