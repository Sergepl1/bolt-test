/*
  # Add rating system

  1. New Tables
    - `ratings`
      - `id` (uuid, primary key)
      - `transaction_id` (uuid, references transactions)
      - `rater_id` (uuid, references profiles)
      - `rated_id` (uuid, references profiles)
      - `communication_rating` (int, 1-5)
      - `reliability_rating` (int, 1-5)
      - `overall_rating` (int, 1-5)
      - `comment` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on ratings table
    - Add policies for ratings
    - Add function to calculate average ratings
*/

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  rater_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  rated_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  communication_rating int NOT NULL CHECK (communication_rating BETWEEN 1 AND 5),
  reliability_rating int NOT NULL CHECK (reliability_rating BETWEEN 1 AND 5),
  overall_rating int NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  
  -- Ensure one rating per user per transaction
  CONSTRAINT unique_rating UNIQUE (transaction_id, rater_id)
);

-- Enable RLS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Rating policies
CREATE POLICY "Anyone can view ratings"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can create ratings for their transactions"
  ON ratings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_id
      AND transactions.status = 'completed'
      AND (
        CASE 
          WHEN auth.uid() IS NULL THEN 
            transactions.seller_id = '00000000-0000-0000-0000-000000000000' OR 
            transactions.buyer_id = '00000000-0000-0000-0000-000000000000'
          ELSE 
            auth.uid() IN (transactions.seller_id, transactions.buyer_id)
        END
      )
    )
  );

-- Function to calculate average ratings
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