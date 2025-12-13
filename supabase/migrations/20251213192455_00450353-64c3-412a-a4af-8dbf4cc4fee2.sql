-- Step 1: Add initial_sequence column
ALTER TABLE public.editorial_queue 
ADD COLUMN IF NOT EXISTS initial_sequence INTEGER;