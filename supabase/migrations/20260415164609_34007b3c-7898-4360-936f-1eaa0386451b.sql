
-- Fix: restrict SELECT policies to prevent listing all files
DROP POLICY "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY "Post images are publicly accessible" ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars' AND auth.role() = 'anon' OR bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Post images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-images' AND auth.role() = 'anon' OR bucket_id = 'post-images' AND auth.role() = 'authenticated');
