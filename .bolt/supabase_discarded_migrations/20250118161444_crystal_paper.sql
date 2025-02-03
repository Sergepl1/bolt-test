-- Drop existing policy
DROP POLICY IF EXISTS "Users can update message read status" ON messages;

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
    EXISTS (
      SELECT 1
      FROM messages m
      WHERE m.id = messages.id
      AND m.conversation_id = messages.conversation_id
      AND m.sender_id = messages.sender_id
      AND m.content = messages.content
      AND m.created_at = messages.created_at
      AND m.read_at IS DISTINCT FROM messages.read_at
    )
  );