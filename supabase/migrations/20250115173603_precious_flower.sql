/*
  # Fix conversations foreign keys

  1. Changes
    - Update foreign key constraints to reference profiles table
    - Add proper indexes for performance
    - Update policies to handle demo user

  2. Security
    - Maintain existing security policies
    - Add proper handling for demo user
*/

-- Drop existing foreign key constraints
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_participant1_id_fkey,
DROP CONSTRAINT IF EXISTS conversations_participant2_id_fkey;

-- Add new foreign key constraints referencing profiles
ALTER TABLE conversations
ADD CONSTRAINT conversations_participant1_id_fkey
  FOREIGN KEY (participant1_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE,
ADD CONSTRAINT conversations_participant2_id_fkey
  FOREIGN KEY (participant2_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Update policies to handle demo user
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN 
        participant1_id = '00000000-0000-0000-0000-000000000000' OR 
        participant2_id = '00000000-0000-0000-0000-000000000000'
      ELSE 
        auth.uid() IN (participant1_id, participant2_id)
    END
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    CASE 
      WHEN auth.uid() IS NULL THEN 
        participant1_id = '00000000-0000-0000-0000-000000000000' OR 
        participant2_id = '00000000-0000-0000-0000-000000000000'
      ELSE 
        auth.uid() IN (participant1_id, participant2_id)
    END
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_listing ON conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);