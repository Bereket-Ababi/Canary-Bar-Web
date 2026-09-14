/*
# Create menu-images storage bucket

1. Storage
- Create public bucket 'menu-images' for admin-uploaded food photos
- Allow public read
- Allow authenticated upload/update
*/

INSERT INTO storage.buckets (id, name, public)
SELECT 'menu-images', 'menu-images', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'menu-images');

DROP POLICY IF EXISTS "Public can read menu images" ON storage.objects;
CREATE POLICY "Public can read menu images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Authenticated can upload menu images" ON storage.objects;
CREATE POLICY "Authenticated can upload menu images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Authenticated can update menu images" ON storage.objects;
CREATE POLICY "Authenticated can update menu images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'menu-images') WITH CHECK (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Authenticated can delete menu images" ON storage.objects;
CREATE POLICY "Authenticated can delete menu images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'menu-images');
