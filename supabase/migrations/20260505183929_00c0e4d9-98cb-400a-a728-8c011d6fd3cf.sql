-- Replace the public SELECT policy on companies with one that only exposes non-sensitive columns to the public.
-- Editors/admins still have full access via the existing "Editors can manage companies" policy.

DROP POLICY IF EXISTS "Anyone can view companies" ON public.companies;

-- Public read: all rows, but email/phone columns are revoked below at column level.
CREATE POLICY "Public can view companies"
ON public.companies
FOR SELECT
TO anon, authenticated
USING (true);

-- Column-level revoke: anon and authenticated cannot read email/phone.
REVOKE SELECT (email, phone) ON public.companies FROM anon;
REVOKE SELECT (email, phone) ON public.companies FROM authenticated;

-- Re-grant non-sensitive columns explicitly so the public policy still works.
GRANT SELECT (
  id, name, slug, logo_url, website, description, industry_role,
  country, region_id, headquarters, year_founded, solutions, notes,
  created_at, updated_at
) ON public.companies TO anon, authenticated;