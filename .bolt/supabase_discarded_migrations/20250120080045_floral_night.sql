-- Drop existing policies
DROP POLICY IF EXISTS "Users can create reports" ON listing_reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON listing_reports;

-- Create new policies for listing reports
CREATE POLICY "Anyone can create reports"
  ON listing_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own reports"
  ON listing_reports FOR SELECT
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN reporter_id = '00000000-0000-0000-0000-000000000000'
      ELSE reporter_id = auth.uid() OR is_admin(auth.uid())
    END
  );

-- Create policy for admins to update reports
CREATE POLICY "Admins can update reports"
  ON listing_reports FOR UPDATE
  USING (is_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listing_reports_listing_status 
  ON listing_reports(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_listing_reports_reporter 
  ON listing_reports(reporter_id);