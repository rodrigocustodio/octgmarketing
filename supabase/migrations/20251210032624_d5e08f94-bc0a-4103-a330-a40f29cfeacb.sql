-- Create events table for industry conferences and exhibitions
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  location TEXT NOT NULL,
  venue TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  website TEXT,
  image_url TEXT,
  region_id UUID REFERENCES public.regions(id),
  attendees_count TEXT,
  exhibitors_count TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Public can view events
CREATE POLICY "Anyone can view events" ON public.events
FOR SELECT USING (true);

-- Editors can manage events
CREATE POLICY "Editors can manage events" ON public.events
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for date-based queries
CREATE INDEX idx_events_start_date ON public.events(start_date);
CREATE INDEX idx_events_slug ON public.events(slug);