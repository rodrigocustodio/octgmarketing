
-- 1) scrape_sources: remove public SELECT
DROP POLICY IF EXISTS "Anyone can view scrape_sources" ON public.scrape_sources;
CREATE POLICY "Editors can view scrape_sources"
ON public.scrape_sources
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- 2) companies: hide email and phone columns from anon (and authenticated non-editors)
-- Editors/admins still get full access via the existing "Editors can manage companies" policy + table-level grant.
REVOKE SELECT (email, phone) ON public.companies FROM anon;
REVOKE SELECT (email, phone) ON public.companies FROM authenticated;
-- Re-grant to service_role (already has it implicitly, but explicit for clarity)
GRANT SELECT (email, phone) ON public.companies TO service_role;

-- 3) Storage: restrict article-images write operations to admin/editor only
DROP POLICY IF EXISTS "Authenticated users can upload article images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update article images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete article images" ON storage.objects;

CREATE POLICY "Editors can upload article images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'article-images'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);

CREATE POLICY "Editors can update article images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'article-images'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);

CREATE POLICY "Editors can delete article images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'article-images'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);
