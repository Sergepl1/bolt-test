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