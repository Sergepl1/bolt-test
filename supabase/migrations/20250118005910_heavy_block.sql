-- Drop existing message policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update message read status" ON messages;

-- Create new message policies without recursion
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
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
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
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
    AND (
      CASE 
        WHEN auth.uid() IS NULL THEN sender_id = '00000000-0000-0000-0000-000000000000'
        ELSE auth.uid() = sender_id
      END
    )
  );

-- Create a function to check if a message can be marked as read
CREATE OR REPLACE FUNCTION can_mark_message_as_read(message_id uuid, new_read_status boolean)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE m.id = message_id
    AND (
      CASE 
        WHEN auth.uid() IS NULL THEN 
          c.participant1_id = '00000000-0000-0000-0000-000000000000' OR 
          c.participant2_id = '00000000-0000-0000-0000-000000000000'
        ELSE 
          auth.uid() IN (c.participant1_id, c.participant2_id)
      END
    )
    AND m.read IS DISTINCT FROM new_read_status
  );
END;
$$;

-- Create policy for updating message read status using the helper function
CREATE POLICY "Users can update message read status"
  ON messages FOR UPDATE
  USING (can_mark_message_as_read(id, read))
  WITH CHECK (
    -- Only allow updating the read status
    can_mark_message_as_read(id, read)
  );