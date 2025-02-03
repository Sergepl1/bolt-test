/*
  # Fix ratings constraint

  1. Changes
    - Remove the CHECK constraint that uses a subquery
    - Add a trigger to validate transaction completion instead
    - Add function to check transaction status before rating

  2. Security
    - Maintain the same security level by moving the check to a trigger
    - Ensure ratings can only be added for completed transactions
*/

-- Drop the problematic constraint
ALTER TABLE ratings
DROP CONSTRAINT IF EXISTS rating_requires_completed_transaction;

-- Create function to validate transaction completion
CREATE OR REPLACE FUNCTION check_transaction_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM transactions 
    WHERE id = NEW.transaction_id 
    AND status = 'completed'
  ) THEN
    RAISE EXCEPTION 'Rating can only be added for completed transactions';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to check transaction status before rating
CREATE TRIGGER check_transaction_before_rating
  BEFORE INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION check_transaction_completion();

-- Update the get_user_ratings function to handle NULL values better
CREATE OR REPLACE FUNCTION get_user_ratings(user_id uuid)
RETURNS TABLE (
  total_ratings bigint,
  avg_communication numeric,
  avg_reliability numeric,
  avg_overall numeric,
  recent_ratings json
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ratings_summary record;
  recent_ratings_json json;
BEGIN
  -- Get the aggregated ratings
  SELECT
    COUNT(*)::bigint,
    ROUND(AVG(communication_rating)::numeric, 1),
    ROUND(AVG(reliability_rating)::numeric, 1),
    ROUND(AVG(overall_rating)::numeric, 1)
  INTO ratings_summary
  FROM ratings
  WHERE rated_id = user_id;

  -- Get recent ratings with rater information
  WITH recent_ratings AS (
    SELECT
      r.id,
      r.overall_rating,
      r.communication_rating,
      r.reliability_rating,
      r.comment,
      r.created_at,
      json_build_object(
        'id', p.id,
        'username', p.username,
        'avatar_url', p.avatar_url
      ) as rater
    FROM ratings r
    JOIN profiles p ON p.id = r.rater_id
    WHERE r.rated_id = user_id
    ORDER BY r.created_at DESC
    LIMIT 5
  )
  SELECT json_agg(recent_ratings)
  INTO recent_ratings_json
  FROM recent_ratings;

  RETURN QUERY
  SELECT
    COALESCE(ratings_summary.count, 0::bigint),
    COALESCE(ratings_summary.round, 0::numeric),
    COALESCE(ratings_summary.round, 0::numeric),
    COALESCE(ratings_summary.round, 0::numeric),
    COALESCE(recent_ratings_json, '[]'::json);
END;
$$;