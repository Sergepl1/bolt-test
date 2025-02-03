-- Function to calculate average ratings and get recent ratings
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
  SELECT
    COUNT(*)::bigint as total_ratings,
    ROUND(AVG(communication_rating)::numeric, 1) as avg_communication,
    ROUND(AVG(reliability_rating)::numeric, 1) as avg_reliability,
    ROUND(AVG(overall_rating)::numeric, 1) as avg_overall,
    COALESCE(
      (
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
        )
        FROM ratings r
        JOIN profiles p ON p.id = r.rater_id
        WHERE r.rated_id = user_id
      ),
      '[]'::json
    ) as recent_ratings
  FROM ratings
  WHERE rated_id = user_id;
END;
$$;

-- Function to check if a user can rate another user
CREATE OR REPLACE FUNCTION can_rate_user(rater_id uuid, rated_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
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