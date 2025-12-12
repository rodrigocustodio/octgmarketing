-- Add solutions column to companies table for storing 3-5 key company solutions
ALTER TABLE public.companies 
ADD COLUMN solutions JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN public.companies.solutions IS 'Array of company solutions/services. Each item: {"title": "string", "description": "string"}. Min 3, max 5 items.';