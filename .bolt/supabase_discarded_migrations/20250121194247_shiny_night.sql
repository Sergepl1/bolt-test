-- Drop existing notification functions
DROP FUNCTION IF EXISTS send_notification_email(text, text, text);
DROP FUNCTION IF EXISTS notify_listing_approved();
DROP FUNCTION IF EXISTS notify_listing_rejected();
DROP FUNCTION IF EXISTS notify_new_message();

-- Create improved notification functions
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
  -- Store notification in database
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    data,
    emailed
  )
  SELECT
    id,
    'email'::notification_type,
    subject,
    html_content,
    jsonb_build_object(
      'to_email', to_email,
      'subject', subject,
      'html_content', html_content
    ),
    false
  FROM auth.users
  WHERE email = to_email;
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

  -- Store email notification
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

  -- Store email notification
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

  -- Store email notification
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

-- Recreate triggers
DROP TRIGGER IF EXISTS on_listing_approved ON listings;
DROP TRIGGER IF EXISTS on_listing_rejected ON listings;
DROP TRIGGER IF EXISTS on_new_message ON messages;

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