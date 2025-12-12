-- Add event_id column to articles table for direct event-article linking
ALTER TABLE public.articles 
ADD COLUMN event_id uuid REFERENCES public.events(id) ON DELETE SET NULL;

-- Create index for efficient querying
CREATE INDEX idx_articles_event_id ON public.articles(event_id);

-- Add comment for documentation
COMMENT ON COLUMN public.articles.event_id IS 'Optional reference to a related event for event coverage articles';