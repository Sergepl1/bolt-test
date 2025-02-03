/*
  # Messaging System Enhancements

  1. Changes
    - Add realtime enabled flag for messages table
    - Add function to handle message notifications
    - Add trigger for message notifications
    - Add notification settings to user profiles

  2. Security
    - Enable RLS for all new tables
    - Add policies for notification access
*/

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Add notification settings to profiles
ALTER TABLE profiles
ADD COLUMN message_notifications boolean DEFAULT true;

-- Create notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create notification policies
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Create function to handle message notifications
CREATE OR REPLACE FUNCTION handle_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  conversation_data record;
  recipient_id uuid;
BEGIN
  -- Get conversation details
  SELECT 
    c.*,
    l.title as listing_title,
    CASE 
      WHEN NEW.sender_id = c.participant1_id THEN c.participant2_id
      ELSE c.participant1_id
    END as recipient_id
  INTO conversation_data
  FROM conversations c
  JOIN listings l ON l.id = c.listing_id
  WHERE c.id = NEW.conversation_id;

  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    data
  )
  VALUES (
    conversation_data.recipient_id,
    'message',
    'Neue Nachricht',
    NEW.content,
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'listing_id', conversation_data.listing_id,
      'listing_title', conversation_data.listing_title,
      'sender_id', NEW.sender_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for message notifications
CREATE TRIGGER on_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_notification();

-- Create indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);