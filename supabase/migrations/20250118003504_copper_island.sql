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
BEGIN
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
      )
      ORDER BY r.created_at DESC
      LIMIT 5
    ) as recent
    FROM ratings r
    JOIN profiles p ON p.id = r.rater_id
    WHERE r.rated_id = user_id
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