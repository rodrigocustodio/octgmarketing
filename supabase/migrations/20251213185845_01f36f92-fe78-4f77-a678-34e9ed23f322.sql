-- Add new topics for comprehensive coverage (expanding from 10 to 21)
INSERT INTO topics (name, slug, description) VALUES
  ('Breaking News', 'breaking-news', 'Urgent industry announcements and developments'),
  ('CEO News', 'ceo-news', 'Executive leadership updates and announcements'),
  ('Product News', 'product-news', 'OCTG product launches and specifications'),
  ('Regional Coverage', 'regional-coverage', 'Geographic market analysis and updates'),
  ('SCM Solutions', 'scm-solutions', 'Supply chain management and optimization'),
  ('Energy Events', 'energy-events', 'Conference and trade show coverage'),
  ('AI & Energy', 'ai-energy', 'Artificial intelligence in energy sector'),
  ('Geopolitical', 'geopolitical', 'Political factors affecting energy markets'),
  ('Educational', 'educational', 'Industry guides and explainer content'),
  ('Safety', 'safety', 'Workplace safety and best practices'),
  ('Oil', 'oil', 'Crude oil market and upstream operations'),
  ('Gas & LNG', 'gas-lng', 'Natural gas and LNG sector coverage'),
  ('Logistics', 'logistics', 'Transportation and supply chain logistics')
ON CONFLICT (slug) DO NOTHING;

-- Create editorial_queue table for smart sequencing
CREATE TABLE IF NOT EXISTS editorial_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  priority_score INTEGER NOT NULL DEFAULT 50,
  gap_reason TEXT,
  last_suggested_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  research_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE editorial_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for editorial_queue
CREATE POLICY "Editors can view editorial_queue"
  ON editorial_queue FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors can manage editorial_queue"
  ON editorial_queue FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

-- Add trigger for updated_at
CREATE TRIGGER update_editorial_queue_updated_at
  BEFORE UPDATE ON editorial_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();