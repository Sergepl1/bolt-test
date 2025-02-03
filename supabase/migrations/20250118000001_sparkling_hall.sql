/*
  # Create ratings system

  1. New Tables
    - `transactions`
      - Tracks completed transactions between users
      - Required for rating validation
    - `ratings`
      - Stores user ratings with communication, reliability, and overall scores
      - Links to transactions to ensure valid ratings
    - `rating_notifications`
      - Handles notifications for new ratings

  2. Security
    - Enable RLS on all tables
    - Create policies for secure access
    - Only allow ratings after completed transactions

  3. Functions
    - `get_user_ratings`: Calculate rating stats and get recent ratings
    - `handle_new_rating`: Create notifications for new ratings
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
  CONSTRAINT unique_rating UNIQUE (transaction_id, rater_id),
  
  -- Ensure rating is only possible after transaction completion
  CONSTRAINT rating_requires_completed_transaction CHECK (
    EXISTS (
      SELECT 1 FROM transactions 
      WHERE transactions.id = transaction_id 
      AND transactions.status = 'completed'
    )
  )
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
    (OLD.reported IS DISTINCT FROM NEW.reported) AND
    (OLD.report_reason IS DISTINCT FROM NEW.report_reason) AND
    -- Other fields must remain unchanged
    OLD.transaction_id = NEW.transaction_id AND
    OLD.rater_id = NEW.rater_id AND
    OLD.rated_id = NEW.rated_id AND
    OLD.communication_rating = NEW.communication_rating AND
    OLD.reliability_rating = NEW.reliability_rating AND
    OLD.overall_rating = NEW.overall_rating AND
    OLD.comment = NEW.comment
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