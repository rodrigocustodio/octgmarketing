-- Add last_published_at column for circular queue tracking
ALTER TABLE public.editorial_queue 
ADD COLUMN IF NOT EXISTS last_published_at TIMESTAMP WITH TIME ZONE;