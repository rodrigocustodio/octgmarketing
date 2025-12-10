-- Add gallery_images column to events table
ALTER TABLE public.events ADD COLUMN gallery_images text[] DEFAULT '{}';