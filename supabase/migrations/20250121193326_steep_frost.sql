-- Create notification types enum
CREATE TYPE notification_type AS ENUM (
  'listing_approved',
  'listing_rejected',
  'new_message',
  'listing_sold',
  'new_rating'
);

-- Create notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  emailed boolean DEFAULT false,
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

-- Create function to send email
CREATE OR REPLACE FUNCTION send_notification_email(
  to_email text,
  subject text,
  html_content text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use Supabase's built-in email sending functionality
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.resend_api_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Swoppa <no-reply@swoppa.ch>',
      'to', to_email,
      'subject', subject,
      'html', html_content
    )::text
  );
END;
$$;

-- Create function to handle listing approval notification
CREATE OR REPLACE FUNCTION notify_listing_approved()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  listing_title text;
BEGIN
  -- Get user email and listing title
  SELECT email, l.title
  INTO user_email, listing_title
  FROM auth.users u
  JOIN listings l ON l.user_id = u.id
  WHERE l.id = NEW.id;

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
      'listing_title', listing_title
    )
  );

  -- Send email
  PERFORM send_notification_email(
    user_email,
    'Ihr Inserat wurde freigegeben',
    '<h2>Ihr Inserat wurde freigegeben</h2>' ||
    '<p>Gute Nachrichten! Ihr Inserat "' || listing_title || '" wurde erfolgreich geprüft und ist nun live.</p>' ||
    '<p><a href="https://swoppa.ch/listings/' || NEW.id || '">Zum Inserat</a></p>'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle listing rejection notification
CREATE OR REPLACE FUNCTION notify_listing_rejected()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  listing_title text;
BEGIN
  -- Get user email and listing title
  SELECT email, l.title
  INTO user_email, listing_title
  FROM auth.users u
  JOIN listings l ON l.user_id = u.id
  WHERE l.id = NEW.id;

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
      'listing_title', listing_title,
      'rejection_reason', NEW.rejection_reason
    )
  );

  -- Send email
  PERFORM send_notification_email(
    user_email,
    'Ihr Inserat wurde nicht freigegeben',
    '<h2>Ihr Inserat wurde nicht freigegeben</h2>' ||
    '<p>Leider können wir Ihr Inserat "' || listing_title || '" nicht freigeben.</p>' ||
    '<p><strong>Grund:</strong> ' || NEW.rejection_reason || '</p>' ||
    '<p>Sie können das Inserat überarbeiten und erneut einreichen.</p>' ||
    '<p><a href="https://swoppa.ch/listings/my">Zu meinen Inseraten</a></p>'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle new message notification
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id uuid;
  recipient_email text;
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

  -- Get recipient email and sender username
  SELECT u.email, p.username
  INTO recipient_email, sender_username
  FROM auth.users u
  JOIN profiles p ON p.id = NEW.sender_id
  WHERE u.id = recipient_id;

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

  -- Send email
  PERFORM send_notification_email(
    recipient_email,
    'Neue Nachricht auf Swoppa',
    '<h2>Neue Nachricht auf Swoppa</h2>' ||
    '<p>Sie haben eine neue Nachricht von ' || sender_username || ' zum Inserat "' || listing_title || '" erhalten.</p>' ||
    '<p><a href="https://swoppa.ch/messages">Zur Konversation</a></p>'
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
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);