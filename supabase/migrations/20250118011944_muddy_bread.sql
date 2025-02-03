/*
  # Fix can_rate_user function

  1. Changes
    - Drop existing function first
    - Recreate with proper parameter handling
*/

-- Drop existing function
DROP FUNCTION IF EXISTS can_rate_user(uuid, uuid);

-- Recreate function with proper parameter handling
CREATE OR REPLACE FUNCTION can_rate_user(rater_id uuid, rated_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Validate input
  IF rater_id IS NULL OR rated_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if there's a completed transaction between users
  -- where no rating exists yet
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