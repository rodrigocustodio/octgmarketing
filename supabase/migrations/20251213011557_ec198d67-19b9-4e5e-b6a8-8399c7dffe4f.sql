-- Phase 3: Add data governance metadata columns to steel_prices table
ALTER TABLE public.steel_prices ADD COLUMN IF NOT EXISTS data_role TEXT DEFAULT 'editorial_indicator';
ALTER TABLE public.steel_prices ADD COLUMN IF NOT EXISTS pricing_type TEXT DEFAULT 'proxy';
ALTER TABLE public.steel_prices ADD COLUMN IF NOT EXISTS transactional BOOLEAN DEFAULT false;
ALTER TABLE public.steel_prices ADD COLUMN IF NOT EXISTS source_class TEXT DEFAULT 'public_market_data';