-- Drop the policy that depends on the read column
DROP POLICY IF EXISTS "Users can update message read status" ON messages;

-- Add read_at timestamp to messages table
ALTER TABLE messages
DROP COLUMN IF EXISTS read,
ADD COLUMN read_at timestamptz;

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(conversation_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE messages
  SET read_at = NOW()
  WHERE conversation_id = conversation_id_param
  AND read_at IS NULL
  AND sender_id != auth.uid();
END;
$$;

-- Create function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id_param uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count bigint;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM messages m
  JOIN conversations c ON c.id = m.conversation_id
  WHERE (c.participant1_id = user_id_param OR c.participant2_id = user_id_param)
  AND m.sender_id != user_id_param
  AND m.read_at IS NULL;
  
  RETURN unread_count;
END;
$$;

-- Create new policy for updating message read status
CREATE POLICY "Users can update message read status"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (
        CASE 
          WHEN auth.uid() IS NULL THEN 
            c.participant1_id = '00000000-0000-0000-0000-000000000000' OR 
            c.participant2_id = '00000000-0000-0000-0000-000000000000'
          ELSE 
            auth.uid() IN (c.participant1_id, c.participant2_id)
        END
      )
    )
  )
  WITH CHECK (
    -- Only allow updating the read_at timestamp
    conversation_id = OLD.conversation_id AND
    sender_id = OLD.sender_id AND
    content = OLD.content AND
    created_at = OLD.created_at AND
    read_at IS DISTINCT FROM OLD.read_at
  );