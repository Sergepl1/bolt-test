@@ .. @@
 -- Update the insert policy to allow anonymous uploads
 DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
 
+-- Ensure the listings bucket exists
+DO $$
+BEGIN
+  INSERT INTO storage.buckets (id, name, public)
+  VALUES ('listings', 'listings', true)
+  ON CONFLICT (id) DO NOTHING;
+END $$;
+
 CREATE POLICY "Anyone can upload images"
 ON storage.objects FOR INSERT
 WITH CHECK (bucket_id = 'listings');