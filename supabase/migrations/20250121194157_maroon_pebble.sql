@@ .. @@
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
-  -- Use Supabase's built-in email sending functionality
-  PERFORM net.http_post(
-    url := 'https://api.resend.com/emails',
-    headers := jsonb_build_object(
-      'Authorization', 'Bearer ' || current_setting('app.settings.resend_api_key'),
-      'Content-Type', 'application/json'
-    ),
-    body := jsonb_build_object(
-      'from', 'Swoppa <no-reply@swoppa.ch>',
-      'to', to_email,
-      'subject', subject,
-      'html', html_content
-    )::text
-  );
+  -- Store email in notifications table for now
+  -- In production, this would be replaced with actual email sending logic
+  INSERT INTO notifications (
+    user_id,
+    type,
+    title,
+    content,
+    data,
+    emailed
+  )
+  SELECT
+    id,
+    'email'::notification_type,
+    subject,
+    html_content,
+    jsonb_build_object(
+      'to_email', to_email,
+      'subject', subject,
+      'html_content', html_content
+    ),
+    false
+  FROM auth.users
+  WHERE email = to_email;
 END;
 $$;
@@ .. @@
 -- Create notification types enum
 CREATE TYPE notification_type AS ENUM (
+  'email',
   'listing_approved',
   'listing_rejected',
   'new_message',