-- Create steel_prices table for caching daily pricing data
CREATE TABLE public.steel_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  change NUMERIC DEFAULT 0,
  change_percent NUMERIC DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'stock',
  region TEXT DEFAULT 'Global',
  currency TEXT DEFAULT 'USD',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.steel_prices ENABLE ROW LEVEL SECURITY;

-- Public read access (prices are public data)
CREATE POLICY "Anyone can view steel prices" 
ON public.steel_prices 
FOR SELECT 
USING (true);

-- Only service role can insert/update (edge function)
CREATE POLICY "Service role can manage steel prices" 
ON public.steel_prices 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX idx_steel_prices_category ON public.steel_prices(category);
CREATE INDEX idx_steel_prices_updated_at ON public.steel_prices(updated_at);

-- Add trigger for updated_at
CREATE TRIGGER update_steel_prices_updated_at
BEFORE UPDATE ON public.steel_prices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();