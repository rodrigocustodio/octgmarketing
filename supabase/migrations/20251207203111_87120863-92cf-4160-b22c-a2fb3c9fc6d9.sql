-- Create company_role enum for industry categorization
CREATE TYPE public.company_role AS ENUM (
  'mill',
  'yard', 
  'inspection',
  'drilling',
  'logistics',
  'software',
  'trading'
);

-- Add new columns to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS industry_role public.company_role,
ADD COLUMN IF NOT EXISTS region_id uuid REFERENCES public.regions(id),
ADD COLUMN IF NOT EXISTS headquarters text,
ADD COLUMN IF NOT EXISTS year_founded integer,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS notes text;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_companies_industry_role ON public.companies(industry_role);
CREATE INDEX IF NOT EXISTS idx_companies_region_id ON public.companies(region_id);