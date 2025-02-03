-- Drop existing policy
DROP POLICY IF EXISTS "Users can update message read status" ON messages;

-- Create new policy for updating message read status
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
    conversation_id = OLD.conversation_id AND
    sender_id = OLD.sender_id AND
    content = OLD.content AND
    created_at = OLD.created_at AND
    read IS DISTINCT FROM OLD.read
  );

-- Recreate the conversation update trigger
DROP TRIGGER IF EXISTS after_message_insert ON messages;
DROP FUNCTION IF EXISTS update_conversation_timestamp();

CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();