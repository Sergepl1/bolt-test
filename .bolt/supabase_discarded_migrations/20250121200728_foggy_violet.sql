-- Drop existing email-related functions
DROP FUNCTION IF EXISTS send_email(text, text, text);
DROP FUNCTION IF EXISTS process_notification_emails();

-- Create function to store email in notifications
CREATE OR REPLACE FUNCTION queue_email(
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
  -- Store email in notifications table
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    data
  )
  SELECT
    id,
    'system',
    subject,
    html_content,
    jsonb_build_object(
      'to_email', to_email,
      'subject', subject,
      'html_content', html_content,
      'queued_at', now()
    )
  FROM auth.users
  WHERE email = to_email;
END;
$$;

-- Update notification triggers to use queue_email
CREATE OR REPLACE FUNCTION notify_listing_approved()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
BEGIN
  -- Get user email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;

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

  -- Queue email notification
  PERFORM queue_email(
    user_email,
    'Ihr Inserat wurde freigegeben',
    '<h2>Ihr Inserat wurde freigegeben</h2>' ||
    '<p>Gute Nachrichten! Ihr Inserat "' || NEW.title || '" wurde erfolgreich geprüft und ist nun live.</p>' ||
    '<p><a href="https://swoppa.ch/listings/' || NEW.id || '">Zum Inserat</a></p>'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;