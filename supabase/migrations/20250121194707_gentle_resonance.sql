-- Drop existing update policy
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;

-- Create new update policy without using OLD reference
CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN user_id = '00000000-0000-0000-0000-000000000000'
      ELSE auth.uid() = user_id
    END
  )
  WITH CHECK (
    -- Only allow updating the read status
    EXISTS (
      SELECT 1
      FROM notifications n
      WHERE n.id = notifications.id
      AND n.user_id = notifications.user_id
      AND n.type = notifications.type
      AND n.title = notifications.title
      AND n.content = notifications.content
      AND n.data = notifications.data
      AND n.created_at = notifications.created_at
      AND n.read IS DISTINCT FROM notifications.read
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_read_user 
  ON notifications(user_id, read) 
  WHERE read = false;