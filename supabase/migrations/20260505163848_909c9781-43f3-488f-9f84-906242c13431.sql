CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE public.automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  status text NOT NULL,
  items_processed int DEFAULT 0,
  items_succeeded int DEFAULT 0,
  payload jsonb DEFAULT '{}'::jsonb,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX idx_automation_runs_job_started ON public.automation_runs(job_name, started_at DESC);
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Editors can read automation_runs"
  ON public.automation_runs FOR SELECT
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));

CREATE POLICY "Service role manages automation_runs"
  ON public.automation_runs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

ALTER TABLE public.executives
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS priority_tier int DEFAULT 2,
  ADD COLUMN IF NOT EXISTS photo_phash text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE public.steel_prices ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS sources jsonb DEFAULT '[]'::jsonb;