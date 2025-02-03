-- Drop existing transaction policies
DROP POLICY IF EXISTS "Users can view their transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON transactions;

-- Create new transaction policies
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

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_seller 
  ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer 
  ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_listing 
  ON transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status 
  ON transactions(status);