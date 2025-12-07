-- Add columns to store AI-suggested metadata for auto-population
ALTER TABLE draft_articles
ADD COLUMN IF NOT EXISTS suggested_topic_ids uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS suggested_company_ids uuid[] DEFAULT '{}';