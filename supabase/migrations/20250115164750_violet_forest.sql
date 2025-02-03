/*
  # Fix Conversation Policy

  1. Changes
    - Drop existing conversation policy
    - Recreate conversation policy with updated conditions

  2. Security
    - Maintain same security level
    - No data loss
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;

-- Recreate the policy with updated conditions
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    auth.uid() = participant1_id OR
    auth.uid() = participant2_id
  );