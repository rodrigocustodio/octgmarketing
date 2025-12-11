-- Create editorial_suggestions table for AI-generated topic suggestions
CREATE TABLE public.editorial_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  suggestion_type text NOT NULL DEFAULT 'topic',
  title text NOT NULL,
  description text,
  target_region_id uuid REFERENCES public.regions(id),
  target_topic_ids uuid[] DEFAULT '{}',
  target_company_ids uuid[] DEFAULT '{}',
  seo_score integer DEFAULT 50,
  business_score integer DEFAULT 50,
  status text NOT NULL DEFAULT 'pending',
  source text DEFAULT 'ai'
);

-- Create top_companies_watchlist for tracking major industry companies
CREATE TABLE public.top_companies_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  priority integer DEFAULT 50,
  category text NOT NULL DEFAULT 'octg_mill',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.editorial_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.top_companies_watchlist ENABLE ROW LEVEL SECURITY;

-- RLS policies for editorial_suggestions
CREATE POLICY "Editors can view editorial_suggestions" ON public.editorial_suggestions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors can manage editorial_suggestions" ON public.editorial_suggestions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- RLS policies for top_companies_watchlist
CREATE POLICY "Editors can view top_companies_watchlist" ON public.top_companies_watchlist
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors can manage top_companies_watchlist" ON public.top_companies_watchlist
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_editorial_suggestions_updated_at
  BEFORE UPDATE ON public.editorial_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();