-- Drop existing function if it exists
DROP FUNCTION IF EXISTS mark_messages_as_read(uuid);

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(conversation_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Validate input
  IF conversation_id_param IS NULL THEN
    RETURN 0;
  END IF;

  -- Update messages and get count of updated rows
  WITH updated AS (
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
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO updated_count FROM updated;

  RETURN updated_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_messages_as_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(uuid) TO anon;

-- Create index for read_at timestamp if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);

-- Update existing messages to use read_at instead of read
UPDATE messages 
SET read_at = created_at 
WHERE read_at IS NULL 
AND read = true;