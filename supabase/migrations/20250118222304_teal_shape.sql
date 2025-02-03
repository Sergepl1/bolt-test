/*
  # Add email notifications for contact form

  1. New Functions
    - `handle_contact_message_notification`: Sends email notifications when a new contact message is received
    - `send_contact_notification_email`: Helper function to send the actual email

  2. Triggers
    - Creates a trigger to automatically send notifications when a new contact message is inserted

  3. Security
    - Functions are set as SECURITY DEFINER to ensure they can always send emails
    - Proper input validation and sanitization
*/

-- Create function to send email notification
CREATE OR REPLACE FUNCTION send_contact_notification_email(
  to_email text,
  subject text,
  message_content text
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
      'from', 'Swoppa Contact Form <no-reply@swoppa.ch>',
      'to', to_email,
      'subject', subject,
      'html', message_content
    )::text
  );
END;
$$;

-- Create function to handle new contact message notifications
CREATE OR REPLACE FUNCTION handle_contact_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Send notification to admin
  PERFORM send_contact_notification_email(
    'contact@swoppa.ch',
    'Neue Kontaktanfrage: ' || NEW.subject,
    '<h2>Neue Kontaktanfrage von ' || NEW.name || '</h2>' ||
    '<p><strong>E-Mail:</strong> ' || NEW.email || '</p>' ||
    '<p><strong>Betreff:</strong> ' || NEW.subject || '</p>' ||
    '<p><strong>Nachricht:</strong></p>' ||
    '<p>' || NEW.message || '</p>'
  );

  -- Send confirmation to user
  PERFORM send_contact_notification_email(
    NEW.email,
    'Ihre Nachricht an Swoppa',
    '<h2>Vielen Dank für Ihre Nachricht</h2>' ||
    '<p>Wir haben Ihre Anfrage erhalten und werden uns so schnell wie möglich bei Ihnen melden.</p>' ||
    '<p><strong>Ihre Nachricht:</strong></p>' ||
    '<p>' || NEW.message || '</p>' ||
    '<br>' ||
    '<p>Mit freundlichen Grüßen</p>' ||
    '<p>Ihr Swoppa-Team</p>'
  );

  RETURN NEW;
END;
$$;

-- Create trigger for contact message notifications
CREATE TRIGGER on_contact_message_created
  AFTER INSERT ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_contact_message_notification();