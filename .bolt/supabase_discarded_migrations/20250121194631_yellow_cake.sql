-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Create new policies
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN user_id = '00000000-0000-0000-0000-000000000000'
      ELSE auth.uid() = user_id
    END
  );

CREATE POLICY "Anyone can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

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
    read IS DISTINCT FROM OLD.read AND
    user_id = OLD.user_id AND
    type = OLD.type AND
    title = OLD.title AND
    content = OLD.content AND
    data = OLD.data AND
    created_at = OLD.created_at
  );

-- Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_as_read(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications
  SET read = true
  WHERE user_id = user_id_param
  AND read = false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_notifications_as_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_as_read(uuid) TO anon;