-- Create transaction status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS transactions (
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

-- Create ratings table if it doesn't exist
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
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Create transaction policies
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

CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    CASE 
      WHEN auth.uid() IS NULL THEN 
        seller_id = '00000000-0000-0000-0000-000000000000' OR 
        buyer_id = '00000000-0000-0000-0000-000000000000'
      ELSE 
        auth.uid() IN (seller_id, buyer_id)
    END
  );

-- Create rating policies
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

-- Create function to check if a user can rate another user
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