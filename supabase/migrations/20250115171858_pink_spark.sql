/*
  # Add foreign key relationships for conversations

  1. Changes
    - Add foreign key relationships between conversations and profiles tables
    - Update existing policies to use the new relationships

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with proper foreign key constraints
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

-- Add foreign key relationships
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_participant1_id_fkey,
DROP CONSTRAINT IF EXISTS conversations_participant2_id_fkey;

ALTER TABLE conversations
ADD CONSTRAINT conversations_participant1_id_fkey
  FOREIGN KEY (participant1_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE,
ADD CONSTRAINT conversations_participant2_id_fkey
  FOREIGN KEY (participant2_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Recreate policies with proper relationships
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    auth.uid() IN (participant1_id, participant2_id)
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    auth.uid() IN (participant1_id, participant2_id)
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants
  ON conversations(participant1_id, participant2_id);