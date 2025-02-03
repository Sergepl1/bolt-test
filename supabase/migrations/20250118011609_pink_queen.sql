/*
  # Add rating functions

  1. New Functions
    - `can_rate_user`: Checks if a user can rate another user based on completed transactions
    - `get_transaction_rating`: Gets the rating for a specific transaction
    - `get_user_ratings`: Gets a user's rating statistics and recent ratings

  2. Changes
    - Added proper error handling
    - Added input validation
    - Added security definer to all functions
*/

-- Function to check if a user can rate another user
CREATE OR REPLACE FUNCTION can_rate_user(rater_id uuid, rated_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Validate input
  IF rater_id IS NULL OR rated_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if there's a completed transaction between users
  -- where no rating exists yet
  RETURN EXISTS (
    SELECT 1
    FROM transactions t
    WHERE t.status = 'completed'
    AND (
      (t.buyer_id = rater_id AND t.seller_id = rated_id) OR
      (t.seller_id = rater_id AND t.buyer_id = rated_id)
    )
    AND NOT EXISTS (
      SELECT 1
      FROM ratings r
      WHERE r.transaction_id = t.id
      AND r.rater_id = rater_id
      AND r.rated_id = rated_id
    )
  );
END;
$$;

-- Function to get a user's rating for a specific transaction
CREATE OR REPLACE FUNCTION get_transaction_rating(transaction_id uuid, rater_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  rating_data json;
BEGIN
  -- Validate input
  IF transaction_id IS NULL OR rater_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'id', r.id,
    'overall_rating', r.overall_rating,
    'communication_rating', r.communication_rating,
    'reliability_rating', r.reliability_rating,
    'comment', r.comment,
    'created_at', r.created_at
  )
  INTO rating_data
  FROM ratings r
  WHERE r.transaction_id = transaction_id
  AND r.rater_id = rater_id;

  RETURN rating_data;
END;
$$;

-- Function to get a user's rating statistics and recent ratings
CREATE OR REPLACE FUNCTION get_user_ratings(user_id uuid)
RETURNS TABLE (
  total_ratings bigint,
  avg_communication numeric,
  avg_reliability numeric,
  avg_overall numeric,
  recent_ratings json
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Validate input
  IF user_id IS NULL THEN
    RETURN QUERY SELECT 0::bigint, 0::numeric, 0::numeric, 0::numeric, '[]'::json;
    RETURN;
  END IF;

  RETURN QUERY
  WITH rating_stats AS (
    SELECT
      COUNT(*)::bigint as total_count,
      ROUND(AVG(communication_rating)::numeric, 1) as avg_comm,
      ROUND(AVG(reliability_rating)::numeric, 1) as avg_rel,
      ROUND(AVG(overall_rating)::numeric, 1) as avg_overall
    FROM ratings
    WHERE rated_id = user_id
  ),
  recent_rating_data AS (
    SELECT json_agg(
      json_build_object(
        'id', r.id,
        'overall_rating', r.overall_rating,
        'communication_rating', r.communication_rating,
        'reliability_rating', r.reliability_rating,
        'comment', r.comment,
        'created_at', r.created_at,
        'rater', json_build_object(
          'id', p.id,
          'username', p.username,
          'avatar_url', p.avatar_url
        )
      ) ORDER BY r.created_at DESC
    ) as recent
    FROM (
      SELECT *
      FROM ratings
      WHERE rated_id = user_id
      ORDER BY created_at DESC
      LIMIT 5
    ) r
    JOIN profiles p ON p.id = r.rater_id
  )
  SELECT
    COALESCE(rs.total_count, 0::bigint),
    COALESCE(rs.avg_comm, 0::numeric),
    COALESCE(rs.avg_rel, 0::numeric),
    COALESCE(rs.avg_overall, 0::numeric),
    COALESCE(rrd.recent, '[]'::json)
  FROM rating_stats rs
  CROSS JOIN recent_rating_data rrd;
END;
$$;