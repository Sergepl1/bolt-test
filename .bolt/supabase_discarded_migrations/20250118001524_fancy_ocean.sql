/*
  # Fix messaging system

  1. Changes
    - Remove demo user handling from policies
    - Fix foreign key constraints
    - Add proper indexes for performance
    - Update policies to handle authenticated users only

  2. Security
    - Ensure only authenticated users can create and view messages
    - Add proper constraints for conversation participants
*/

-- Drop existing foreign key constraints
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_participant1_id_fkey,
DROP CONSTRAINT IF EXISTS conversations_participant2_id_fkey;

-- Add new foreign key constraints referencing auth.users
ALTER TABLE conversations
ADD CONSTRAINT conversations_participant1_id_fkey
  FOREIGN KEY (participant1_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE,
ADD CONSTRAINT conversations_participant2_id_fkey
  FOREIGN KEY (participant2_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;

-- Create new conversation policies for authenticated users only
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (auth.uid() IN (participant1_id, participant2_id));

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IN (participant1_id, participant2_id));

-- Create new message policies for authenticated users only
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND auth.uid() IN (participant1_id, participant2_id)
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND auth.uid() IN (participant1_id, participant2_id)
    )
    AND auth.uid() = sender_id
  );

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants_listing 
  ON conversations(participant1_id, participant2_id, listing_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_sender_created 
  ON messages(conversation_id, sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_read 
  ON messages(conversation_id, read);