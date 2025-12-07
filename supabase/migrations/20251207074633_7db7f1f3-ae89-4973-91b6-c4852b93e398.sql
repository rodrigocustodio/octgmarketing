-- Phase 1: Data Infrastructure for AI Editorial Automation

-- Step 1: Create enums for article statuses
CREATE TYPE source_article_status AS ENUM ('new', 'processed', 'failed');
CREATE TYPE draft_article_status AS ENUM ('pending_review', 'approved', 'rejected');

-- Step 2: Create source_articles table (raw scraped news)
CREATE TABLE public.source_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  title TEXT NOT NULL,
  raw_content TEXT,
  image_url TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status source_article_status NOT NULL DEFAULT 'new',
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 3: Create draft_articles table (AI-rewritten articles)
CREATE TABLE public.draft_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_article_id UUID REFERENCES public.source_articles(id) ON DELETE CASCADE,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  body_markdown TEXT,
  hero_image_url TEXT,
  tags JSONB DEFAULT '[]',
  status draft_article_status NOT NULL DEFAULT 'pending_review',
  editor_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_source_articles_status ON public.source_articles(status);
CREATE INDEX idx_source_articles_region ON public.source_articles(region_id);
CREATE INDEX idx_source_articles_scraped_at ON public.source_articles(scraped_at DESC);
CREATE INDEX idx_draft_articles_status ON public.draft_articles(status);
CREATE INDEX idx_draft_articles_source ON public.draft_articles(source_article_id);
CREATE UNIQUE INDEX idx_draft_articles_slug ON public.draft_articles(slug);

-- Step 5: Enable RLS
ALTER TABLE public.source_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_articles ENABLE ROW LEVEL SECURITY;

-- Step 6: RLS Policies for source_articles
CREATE POLICY "Admins and editors can view source_articles"
ON public.source_articles FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins and editors can insert source_articles"
ON public.source_articles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins and editors can update source_articles"
ON public.source_articles FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins can delete source_articles"
ON public.source_articles FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Step 7: RLS Policies for draft_articles
CREATE POLICY "Admins and editors can view draft_articles"
ON public.draft_articles FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins and editors can insert draft_articles"
ON public.draft_articles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins and editors can update draft_articles"
ON public.draft_articles FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins can delete draft_articles"
ON public.draft_articles FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Step 8: Add triggers for updated_at
CREATE TRIGGER update_source_articles_updated_at
BEFORE UPDATE ON public.source_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_draft_articles_updated_at
BEFORE UPDATE ON public.draft_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();