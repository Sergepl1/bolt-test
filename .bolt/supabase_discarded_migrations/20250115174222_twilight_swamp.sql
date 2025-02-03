/*
  # Fix foreign key constraints for conversations and messages

  1. Changes
    - Drop and recreate foreign key constraints for conversations table
    - Update policies to handle both authenticated users and demo user
    - Add proper indexes for performance

  2. Security
    - Maintain existing security policies
    - Add proper handling for demo user
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

-- Update policies to handle both authenticated users and demo user
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

-- Update message policies to handle demo user
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        CASE 
          WHEN auth.uid() IS NULL THEN 
            participant1_id = '00000000-0000-0000-0000-000000000000' OR 
            participant2_id = '00000000-0000-0000-0000-000000000000'
          ELSE 
            auth.uid() IN (participant1_id, participant2_id)
        END
      )
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND (
        CASE 
          WHEN auth.uid() IS NULL THEN 
            participant1_id = '00000000-0000-0000-0000-000000000000' OR 
            participant2_id = '00000000-0000-0000-0000-000000000000'
          ELSE 
            auth.uid() IN (participant1_id, participant2_id)
        END
      )
    )
    AND (
      CASE 
        WHEN auth.uid() IS NULL THEN 
          sender_id = '00000000-0000-0000-0000-000000000000'
        ELSE 
          auth.uid() = sender_id
      END
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants 
  ON conversations(participant1_id, participant2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sender 
  ON messages(conversation_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_read 
  ON messages(conversation_id, read);