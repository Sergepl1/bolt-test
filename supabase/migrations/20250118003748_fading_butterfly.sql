/*
  # Fix user ratings function

  1. Changes
    - Fix ambiguous column references in get_user_ratings function
    - Improve aggregation logic with explicit column names
    - Add proper error handling for NULL values
    - Optimize performance with better query structure

  2. Technical Details
    - Use CTEs for better readability and performance
    - Properly handle NULL values with COALESCE
    - Fix column references in aggregations
    - Add explicit ORDER BY for consistent results
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_user_ratings(uuid);

-- Create new function with fixed column references
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
    COUNT(*)::bigint as total_count,
    ROUND(AVG(communication_rating)::numeric, 1) as avg_comm,
    ROUND(AVG(reliability_rating)::numeric, 1) as avg_rel,
    ROUND(AVG(overall_rating)::numeric, 1) as avg_overall
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
    FROM (
      SELECT *
      FROM ratings
      WHERE rated_id = user_id
      ORDER BY created_at DESC
      LIMIT 5
    ) r
    JOIN profiles p ON p.id = r.rater_id
  )
  SELECT json_agg(
    json_build_object(
      'id', recent_ratings.id,
      'overall_rating', recent_ratings.overall_rating,
      'communication_rating', recent_ratings.communication_rating,
      'reliability_rating', recent_ratings.reliability_rating,
      'comment', recent_ratings.comment,
      'created_at', recent_ratings.created_at,
      'rater', recent_ratings.rater
    )
    ORDER BY recent_ratings.created_at DESC
  )
  INTO recent_ratings_json
  FROM recent_ratings;

  RETURN QUERY
  SELECT
    COALESCE(ratings_summary.total_count, 0::bigint),
    COALESCE(ratings_summary.avg_comm, 0::numeric),
    COALESCE(ratings_summary.avg_rel, 0::numeric),
    COALESCE(ratings_summary.avg_overall, 0::numeric),
    COALESCE(recent_ratings_json, '[]'::json);
END;
$$;