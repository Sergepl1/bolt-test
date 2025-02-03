-- Create function to send email via Resend
CREATE OR REPLACE FUNCTION send_email(
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
  -- Send email via Resend API
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

-- Create function to process email notifications
CREATE OR REPLACE FUNCTION process_notification_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_record record;
  user_email text;
BEGIN
  -- Get notifications that need to be emailed
  FOR notification_record IN
    SELECT n.*, u.email
    FROM notifications n
    JOIN auth.users u ON u.id = n.user_id
    WHERE n.type IN ('listing_approved', 'listing_rejected', 'new_message')
    AND NOT EXISTS (
      SELECT 1 FROM notifications e
      WHERE e.user_id = n.user_id
      AND e.data->>'original_notification_id' = n.id::text
      AND e.type = 'system'
    )
  LOOP
    -- Send email based on notification type
    CASE notification_record.type
      WHEN 'listing_approved' THEN
        PERFORM send_email(
          notification_record.email,
          'Ihr Inserat wurde freigegeben',
          '<h2>Ihr Inserat wurde freigegeben</h2>' ||
          '<p>Gute Nachrichten! Ihr Inserat "' || (notification_record.data->>'listing_title') || '" wurde erfolgreich geprüft und ist nun live.</p>' ||
          '<p><a href="https://swoppa.ch/listings/' || (notification_record.data->>'listing_id') || '">Zum Inserat</a></p>'
        );
      
      WHEN 'listing_rejected' THEN
        PERFORM send_email(
          notification_record.email,
          'Ihr Inserat wurde nicht freigegeben',
          '<h2>Ihr Inserat wurde nicht freigegeben</h2>' ||
          '<p>Leider können wir Ihr Inserat "' || (notification_record.data->>'listing_title') || '" nicht freigeben.</p>' ||
          '<p><strong>Grund:</strong> ' || (notification_record.data->>'rejection_reason') || '</p>' ||
          '<p>Sie können das Inserat überarbeiten und erneut einreichen.</p>' ||
          '<p><a href="https://swoppa.ch/listings/my">Zu meinen Inseraten</a></p>'
        );
      
      WHEN 'new_message' THEN
        PERFORM send_email(
          notification_record.email,
          'Neue Nachricht auf Swoppa',
          '<h2>Neue Nachricht auf Swoppa</h2>' ||
          '<p>Sie haben eine neue Nachricht von ' || (notification_record.data->>'sender_username') || ' zum Inserat "' || (notification_record.data->>'listing_title') || '" erhalten.</p>' ||
          '<p><a href="https://swoppa.ch/messages">Zur Konversation</a></p>'
        );
    END CASE;

    -- Create a system notification to track that email was sent
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content,
      data
    ) VALUES (
      notification_record.user_id,
      'system',
      'Email sent',
      'Email notification sent for: ' || notification_record.title,
      jsonb_build_object(
        'original_notification_id', notification_record.id,
        'email_sent_at', now()
      )
    );

  END LOOP;
END;
$$;

-- Create cron job to process emails every minute
SELECT cron.schedule(
  'process-notification-emails',
  '* * * * *',
  'SELECT process_notification_emails()'
);