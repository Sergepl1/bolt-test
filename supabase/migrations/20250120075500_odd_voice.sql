-- Create enum for report status
CREATE TYPE report_status AS ENUM ('pending', 'resolved', 'dismissed');

-- Create enum for report reason
CREATE TYPE report_reason AS ENUM (
  'inappropriate',
  'scam',
  'misleading',
  'counterfeit',
  'offensive',
  'other'
);

-- Create reports table
CREATE TABLE listing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason report_reason NOT NULL,
  details text,
  status report_status DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Ensure one report per user per listing
  CONSTRAINT unique_user_listing_report UNIQUE (listing_id, reporter_id)
);

-- Enable RLS
ALTER TABLE listing_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create reports"
  ON listing_reports FOR INSERT
  WITH CHECK (
    CASE 
      WHEN auth.uid() IS NULL THEN reporter_id = '00000000-0000-0000-0000-000000000000'
      ELSE auth.uid() = reporter_id
    END
  );

CREATE POLICY "Users can view their own reports"
  ON listing_reports FOR SELECT
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN reporter_id = '00000000-0000-0000-0000-000000000000'
      ELSE auth.uid() = reporter_id OR is_admin(auth.uid())
    END
  );

-- Create function to get pending reports for admins
CREATE OR REPLACE FUNCTION get_pending_reports()
RETURNS TABLE (
  id uuid,
  listing_id uuid,
  listing_title text,
  listing_status text,
  reporter_id uuid,
  reporter_username text,
  reason report_reason,
  details text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can view pending reports';
  END IF;

  RETURN QUERY
  SELECT 
    r.id,
    r.listing_id,
    l.title as listing_title,
    l.status::text as listing_status,
    r.reporter_id,
    p.username as reporter_username,
    r.reason,
    r.details,
    r.created_at
  FROM listing_reports r
  JOIN listings l ON l.id = r.listing_id
  LEFT JOIN profiles p ON p.id = r.reporter_id
  WHERE r.status = 'pending'
  ORDER BY r.created_at DESC;
END;
$$;

-- Create function to resolve a report
CREATE OR REPLACE FUNCTION resolve_report(
  report_id_param uuid,
  new_status report_status,
  notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can resolve reports';
  END IF;

  -- Update report status
  UPDATE listing_reports
  SET 
    status = new_status,
    admin_notes = notes,
    resolved_at = now(),
    resolved_by = auth.uid()
  WHERE id = report_id_param;
END;
$$;

-- Create indexes
CREATE INDEX idx_listing_reports_status ON listing_reports(status);
CREATE INDEX idx_listing_reports_listing ON listing_reports(listing_id);
CREATE INDEX idx_listing_reports_reporter ON listing_reports(reporter_id);
CREATE INDEX idx_listing_reports_created_at ON listing_reports(created_at DESC);