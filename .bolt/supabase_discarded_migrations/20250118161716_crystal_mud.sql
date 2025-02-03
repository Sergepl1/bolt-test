-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_unread_message_count(uuid);

-- Create function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id_param uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unread_count bigint;
BEGIN
  -- Validate input
  IF user_id_param IS NULL THEN
    RETURN 0;
  END IF;

  -- Get count of unread messages
  SELECT COUNT(*)
  INTO unread_count
  FROM messages m
  JOIN conversations c ON c.id = m.conversation_id
  WHERE (c.participant1_id = user_id_param OR c.participant2_id = user_id_param)
  AND m.sender_id != user_id_param
  AND m.read_at IS NULL;
  
  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_unread_message_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(uuid) TO anon;