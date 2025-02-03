/*
  # Fix rating policy

  1. Changes
    - Drop existing rating policy
    - Create new policy with proper OLD record reference
    - Add explicit UPDATE permission for rating reports
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can report ratings" ON ratings;

-- Create new policy for reporting ratings
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