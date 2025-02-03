/*
  # Create ratings system

  1. New Tables
    - `transactions`: Tracks completed transactions between users
    - `ratings`: Stores user ratings and reviews
    - `rating_notifications`: Handles rating notifications

  2. Security
    - Enable RLS on all tables
    - Add policies for transactions, ratings, and notifications
    - Add functions for rating calculations and validations

  3. Changes
    - Add transaction status enum
    - Add rating constraints and validations
    - Add notification handling
*/

-- Create transaction status enum
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled');

-- Create transactions table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status transaction_status DEFAULT 'pending',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_transaction UNIQUE (listing_id, buyer_id)
);

-- Create ratings table
CREATE TABLE ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  rater_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  rated_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  communication_rating int NOT NULL CHECK (communication_rating BETWEEN 1 AND 5),
  reliability_rating int NOT NULL CHECK (reliability_rating BETWEEN 1 AND 5),
  overall_rating int NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  comment text,
  reported boolean DEFAULT false,
  report_reason text,
  created_at timestamptz DEFAULT now(),
  
  -- Ensure one rating per user per transaction
  CONSTRAINT unique_rating UNIQUE (transaction_id, rater_id)
);

-- Create notifications table for ratings
CREATE TABLE rating_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  rating_id uuid REFERENCES ratings(id) ON DELETE CASCADE,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_notifications ENABLE ROW LEVEL SECURITY;

-- Transaction policies
CREATE POLICY "Users can view their transactions"
  ON transactions FOR SELECT
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN 
        seller_id = '00000000-0000-0000-0000-000000000000' OR 
        buyer_id = '00000000-0000-0000-0000-000000000000'
      ELSE 
        auth.uid() IN (seller_id, buyer_id)
    END
  );

CREATE POLICY "Sellers can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    CASE 
      WHEN auth.uid() IS NULL THEN seller_id = '00000000-0000-0000-0000-000000000000'
      ELSE auth.uid() = seller_id
    END
  );

CREATE POLICY "Users can update their transactions"
  ON transactions FOR UPDATE
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN 
        seller_id = '00000000-0000-0000-0000-000000000000' OR 
        buyer_id = '00000000-0000-0000-0000-000000000000'
      ELSE 
        auth.uid() IN (seller_id, buyer_id)
    END
  );

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

CREATE POLICY "Users can report ratings"
  ON ratings FOR UPDATE
  USING (true)
  WITH CHECK (
    -- Only allow updating the reported status and reason
    EXISTS (
      SELECT 1
      FROM ratings r
      WHERE r.id = ratings.id
      AND r.reported IS DISTINCT FROM ratings.reported
      AND r.report_reason IS DISTINCT FROM ratings.report_reason
      -- Other fields must remain unchanged
      AND r.transaction_id = ratings.transaction_id
      AND r.rater_id = ratings.rater_id
      AND r.rated_id = ratings.rated_id
      AND r.communication_rating = ratings.communication_rating
      AND r.reliability_rating = ratings.reliability_rating
      AND r.overall_rating = ratings.overall_rating
      AND r.comment = ratings.comment
    )
  );

-- Notification policies
CREATE POLICY "Users can view their notifications"
  ON rating_notifications FOR SELECT
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN user_id = '00000000-0000-0000-0000-000000000000'
      ELSE auth.uid() = user_id
    END
  );

CREATE POLICY "Users can update their notifications"
  ON rating_notifications FOR UPDATE
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN user_id = '00000000-0000-0000-0000-000000000000'
      ELSE auth.uid() = user_id
    END
  );

-- Function to validate transaction completion
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

-- Function to create a notification when a rating is created
CREATE OR REPLACE FUNCTION handle_new_rating()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO rating_notifications (user_id, rating_id)
  VALUES (NEW.rated_id, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new rating notifications
CREATE TRIGGER on_rating_created
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_rating();

-- Function to calculate average ratings
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