-- Create authors table for article writers
CREATE TABLE public.authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  slug TEXT UNIQUE NOT NULL,
  specializations TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

-- Anyone can view authors
CREATE POLICY "Anyone can view authors"
ON public.authors
FOR SELECT
USING (true);

-- Editors can manage authors
CREATE POLICY "Editors can manage authors"
ON public.authors
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- Add foreign key to articles table
ALTER TABLE public.articles
ADD CONSTRAINT articles_author_id_fkey
FOREIGN KEY (author_id) REFERENCES public.authors(id) ON DELETE SET NULL;

-- Insert the 3 team members
INSERT INTO public.authors (name, title, bio, avatar_url, slug, specializations) VALUES
(
  'Franklin Clarke',
  'Regional Coverage Director',
  'Franklin brings over 15 years of experience covering global energy markets, with expertise in European and Australian OCTG operations.',
  '/images/team/franklin-clarke.jpg',
  'franklin-clarke',
  ARRAY['Europe', 'Australia', 'Africa']
),
(
  'Oliver Duncan',
  'Events & Calendar Director',
  'Oliver specializes in Middle Eastern and Asia-Pacific energy sectors, tracking major industry developments and market trends.',
  '/images/team/oliver-duncan.jpg',
  'oliver-duncan',
  ARRAY['Middle East', 'Asia-Pacific']
),
(
  'Maria Oliveira',
  'Latin America Correspondent',
  'Maria is our dedicated correspondent for the Americas, providing in-depth coverage of North and South American OCTG markets.',
  '/images/team/maria-oliveira.jpg',
  'maria-oliveira',
  ARRAY['Americas']
);

-- Update articles with authors based on region
-- Maria Oliveira -> Americas
UPDATE public.articles 
SET author_id = (SELECT id FROM public.authors WHERE slug = 'maria-oliveira')
WHERE region_id IN (SELECT id FROM public.regions WHERE slug = 'americas');

-- Franklin Clarke -> Europe, Australia, Africa
UPDATE public.articles 
SET author_id = (SELECT id FROM public.authors WHERE slug = 'franklin-clarke')
WHERE region_id IN (SELECT id FROM public.regions WHERE slug IN ('europe', 'australia', 'africa'));

-- Oliver Duncan -> Middle East, Asia-Pacific
UPDATE public.articles 
SET author_id = (SELECT id FROM public.authors WHERE slug = 'oliver-duncan')
WHERE region_id IN (SELECT id FROM public.regions WHERE slug IN ('middle-east', 'asia-pacific'));

-- Trigger for updated_at
CREATE TRIGGER update_authors_updated_at
BEFORE UPDATE ON public.authors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();