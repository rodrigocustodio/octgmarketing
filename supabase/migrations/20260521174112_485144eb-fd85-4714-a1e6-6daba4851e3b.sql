-- Stop the old commodity-price cron (data sourced from paid APIs and unreliable)
SELECT cron.unschedule('auto-refresh-steel-prices-15min')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-refresh-steel-prices-15min');

-- Cost pressure direction enum
DO $$ BEGIN
  CREATE TYPE public.cost_pressure_level AS ENUM ('tightening', 'neutral', 'softening');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Weekly Editorial Market Pulse snapshot
CREATE TABLE public.market_pulse (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rig_count_us INTEGER,
  rig_count_us_delta INTEGER,
  rig_count_as_of DATE,
  cost_pressure public.cost_pressure_level NOT NULL DEFAULT 'neutral',
  cost_pressure_rationale TEXT,
  newsroom_focus JSONB NOT NULL DEFAULT '[]'::jsonb,
  editorial_read TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.market_pulse ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view market_pulse"
  ON public.market_pulse FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage market_pulse"
  ON public.market_pulse FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can manage market_pulse"
  ON public.market_pulse FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_market_pulse_updated_at
  BEFORE UPDATE ON public.market_pulse
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed an initial empty row so the UI has something to render before first cron
INSERT INTO public.market_pulse (cost_pressure, cost_pressure_rationale, editorial_read)
VALUES ('neutral', 'Awaiting first weekly read.', 'Editorial Market Pulse will refresh every Friday.');