-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_listing_approved ON listings;
DROP TRIGGER IF EXISTS on_listing_rejected ON listings;
DROP TRIGGER IF EXISTS on_new_message ON messages;

-- Drop existing functions
DROP FUNCTION IF EXISTS notify_listing_approved();
DROP FUNCTION IF EXISTS notify_listing_rejected();
DROP FUNCTION IF EXISTS notify_new_message();

-- Drop and recreate the notification_type enum
DROP TYPE IF EXISTS notification_type CASCADE;
CREATE TYPE notification_type AS ENUM (
  'listing_approved',
  'listing_rejected',
  'new_message',
  'listing_sold',
  'new_rating',
  'system'
);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Create notification functions
CREATE OR REPLACE FUNCTION notify_listing_approved()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    data
  )
  VALUES (
    NEW.user_id,
    'listing_approved',
    'Inserat freigegeben',
    'Ihr Inserat wurde erfolgreich geprüft und freigegeben.',
    jsonb_build_object(
      'listing_id', NEW.id,
      'listing_title', NEW.title
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle listing rejection notification
CREATE OR REPLACE FUNCTION notify_listing_rejected()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    data
  )
  VALUES (
    NEW.user_id,
    'listing_rejected',
    'Inserat abgelehnt',
    'Ihr Inserat wurde leider abgelehnt. Grund: ' || NEW.rejection_reason,
    jsonb_build_object(
      'listing_id', NEW.id,
      'listing_title', NEW.title,
      'rejection_reason', NEW.rejection_reason
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle new message notification
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id uuid;
  listing_title text;
  sender_username text;
BEGIN
  -- Get recipient ID and listing title
  SELECT 
    CASE 
      WHEN c.participant1_id = NEW.sender_id THEN c.participant2_id
      ELSE c.participant1_id
    END,
    l.title
  INTO recipient_id, listing_title
  FROM conversations c
  JOIN listings l ON l.id = c.listing_id
  WHERE c.id = NEW.conversation_id;

  -- Get sender username
  SELECT username
  INTO sender_username
  FROM profiles
  WHERE id = NEW.sender_id;

  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    data
  )
  VALUES (
    recipient_id,
    'new_message',
    'Neue Nachricht',
    'Sie haben eine neue Nachricht von ' || sender_username || ' zum Inserat "' || listing_title || '" erhalten.',
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'listing_title', listing_title,
      'sender_username', sender_username
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER on_listing_approved
  AFTER UPDATE ON listings
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'active')
  EXECUTE FUNCTION notify_listing_approved();

CREATE TRIGGER on_listing_rejected
  AFTER UPDATE ON listings
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'rejected')
  EXECUTE FUNCTION notify_listing_rejected();

CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);