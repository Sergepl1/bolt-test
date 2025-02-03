-- Add read_at timestamp to messages table
ALTER TABLE messages
DROP COLUMN IF EXISTS read,
ADD COLUMN read_at timestamptz;

-- Create index for read_at timestamp
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);

-- Update mark_messages_as_read function to handle null auth.uid()
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