/*
  # Fix messaging system

  1. Changes
    - Drop and recreate conversations table with proper constraints
    - Drop and recreate messages table with proper constraints
    - Update policies to handle both authenticated users and demo user
    - Add proper indexes for performance
    - Add function to handle conversation updates

  2. Security
    - Allow both authenticated users and demo user to create and view messages
    - Add proper constraints for conversation participants
*/

-- Drop existing tables and recreate them
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;

-- Create conversations table
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  participant1_id uuid NOT NULL,
  participant2_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique conversations between participants for a listing
  CONSTRAINT unique_conversation UNIQUE (listing_id, participant1_id, participant2_id)
);

-- Create messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create conversation policies
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

CREATE POLICY "Users can delete their conversations"
  ON conversations FOR DELETE
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN 
        participant1_id = '00000000-0000-0000-0000-000000000000' OR 
        participant2_id = '00000000-0000-0000-0000-000000000000'
      ELSE 
        auth.uid() IN (participant1_id, participant2_id)
    END
  );

-- Create message policies
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
        WHEN auth.uid() IS NULL THEN sender_id = '00000000-0000-0000-0000-000000000000'
        ELSE auth.uid() = sender_id
      END
    )
  );

CREATE POLICY "Users can update message read status"
  ON messages FOR UPDATE
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
  )
  WITH CHECK (
    -- Only allow updating the read status
    OLD.conversation_id = NEW.conversation_id AND
    OLD.sender_id = NEW.sender_id AND
    OLD.content = NEW.content AND
    OLD.created_at = NEW.created_at
  );

-- Create function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating conversation timestamp
CREATE TRIGGER after_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Add indexes for better performance
CREATE INDEX idx_conversations_participants 
  ON conversations(participant1_id, participant2_id);

CREATE INDEX idx_conversations_listing 
  ON conversations(listing_id);

CREATE INDEX idx_messages_conversation_sender 
  ON messages(conversation_id, sender_id);

CREATE INDEX idx_messages_read 
  ON messages(conversation_id, read);

CREATE INDEX idx_messages_created_at 
  ON messages(created_at DESC);