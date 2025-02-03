-- Drop the policy that depends on the read column
DROP POLICY IF EXISTS "Users can update message read status" ON messages;

-- Drop the read column and add read_at timestamp
ALTER TABLE messages
DROP COLUMN IF EXISTS read CASCADE,
ADD COLUMN read_at timestamptz;

-- Create index for read_at timestamp
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);

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
  AND (
    CASE 
      WHEN auth.uid() IS NULL THEN 
        sender_id != '00000000-0000-0000-0000-000000000000'
      ELSE 
        sender_id != auth.uid()
    END
  );
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