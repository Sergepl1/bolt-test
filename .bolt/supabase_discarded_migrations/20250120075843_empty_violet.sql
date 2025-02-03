-- Drop existing function first
DROP FUNCTION IF EXISTS get_pending_reports();

-- Create function to get pending reports for admins
CREATE OR REPLACE FUNCTION get_pending_reports()
RETURNS TABLE (
  id uuid,
  listing_id uuid,
  listing_title text,
  listing_status text,
  reporter_id uuid,
  reporter_username text,
  reason text,
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
    r.reason::text,
    r.details,
    r.created_at
  FROM listing_reports r
  JOIN listings l ON l.id = r.listing_id
  LEFT JOIN profiles p ON p.id = r.reporter_id
  WHERE r.status = 'pending'
  ORDER BY r.created_at DESC;
END;
$$;