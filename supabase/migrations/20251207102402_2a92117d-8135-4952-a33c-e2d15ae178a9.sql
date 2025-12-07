-- Create storage bucket for AI-generated article images
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: Anyone can view images (public bucket)
CREATE POLICY "Public read access for article images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'article-images');

-- RLS policy: Authenticated users can upload images
CREATE POLICY "Authenticated users can upload article images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'article-images' 
  AND auth.role() = 'authenticated'
);

-- RLS policy: Authenticated users can update their uploads
CREATE POLICY "Authenticated users can update article images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'article-images' AND auth.role() = 'authenticated');

-- RLS policy: Authenticated users can delete images
CREATE POLICY "Authenticated users can delete article images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'article-images' AND auth.role() = 'authenticated');