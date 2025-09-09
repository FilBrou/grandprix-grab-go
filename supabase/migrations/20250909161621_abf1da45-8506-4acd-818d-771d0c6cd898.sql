-- Create storage bucket for item images
INSERT INTO storage.buckets (id, name, public) VALUES ('item-images', 'item-images', true);

-- Create policies for item image uploads
CREATE POLICY "Item images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'item-images');

CREATE POLICY "Admins can upload item images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'item-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update item images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'item-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete item images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'item-images' AND is_admin(auth.uid()));