-- Drop the existing function
DROP FUNCTION IF EXISTS get_user_ratings(uuid);

-- Recreate the function with fixed subquery
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