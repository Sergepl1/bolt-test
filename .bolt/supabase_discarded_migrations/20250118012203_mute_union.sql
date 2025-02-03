/*
  # Fix ambiguous column references in can_rate_user function

  1. Changes
    - Drop existing function
    - Recreate with properly qualified column references
    - Use r. and t. prefixes to avoid ambiguity
*/

-- Drop existing function
DROP FUNCTION IF EXISTS can_rate_user(uuid, uuid);

-- Recreate function with properly qualified column references
CREATE OR REPLACE FUNCTION can_rate_user(input_rater_id uuid, input_rated_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Validate input
  IF input_rater_id IS NULL OR input_rated_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if there's a completed transaction between users
  -- where no rating exists yet
  RETURN EXISTS (
    SELECT 1
    FROM transactions t
    WHERE t.status = 'completed'
    AND (
      (t.buyer_id = input_rater_id AND t.seller_id = input_rated_id) OR
      (t.seller_id = input_rater_id AND t.buyer_id = input_rated_id)
    )
    AND NOT EXISTS (
      SELECT 1
      FROM ratings r
      WHERE r.transaction_id = t.id
      AND r.rater_id = input_rater_id
      AND r.rated_id = input_rated_id
    )
  );
END;
$$;