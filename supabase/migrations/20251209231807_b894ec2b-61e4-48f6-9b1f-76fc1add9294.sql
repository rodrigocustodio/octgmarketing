
-- Create product_categories table (9 main sections)
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  hero_image_url TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table (50+ individual products)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  description TEXT,
  technical_specs JSONB DEFAULT '{}'::jsonb,
  applications TEXT[] DEFAULT '{}'::text[],
  hero_image_url TEXT,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  api_standard TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_companies junction table (links products to manufacturers)
CREATE TABLE public.product_companies (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, company_id)
);

-- Create product_articles junction table (related news from OCTG Index)
CREATE TABLE public.product_articles (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, article_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_categories
CREATE POLICY "Anyone can view product_categories"
ON public.product_categories
FOR SELECT
USING (true);

CREATE POLICY "Editors can manage product_categories"
ON public.product_categories
FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

-- RLS Policies for products
CREATE POLICY "Anyone can view products"
ON public.products
FOR SELECT
USING (true);

CREATE POLICY "Editors can manage products"
ON public.products
FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

-- RLS Policies for product_companies
CREATE POLICY "Anyone can view product_companies"
ON public.product_companies
FOR SELECT
USING (true);

CREATE POLICY "Editors can manage product_companies"
ON public.product_companies
FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

-- RLS Policies for product_articles
CREATE POLICY "Anyone can view product_articles"
ON public.product_articles
FOR SELECT
USING (true);

CREATE POLICY "Editors can manage product_articles"
ON public.product_articles
FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

-- Create indexes for better query performance
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_product_categories_slug ON public.product_categories(slug);
CREATE INDEX idx_product_companies_product_id ON public.product_companies(product_id);
CREATE INDEX idx_product_companies_company_id ON public.product_companies(company_id);
CREATE INDEX idx_product_articles_product_id ON public.product_articles(product_id);
CREATE INDEX idx_product_articles_article_id ON public.product_articles(article_id);

-- Add updated_at triggers
CREATE TRIGGER update_product_categories_updated_at
BEFORE UPDATE ON public.product_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
