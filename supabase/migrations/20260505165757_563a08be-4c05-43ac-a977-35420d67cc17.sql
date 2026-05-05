
-- Tier 1: supermajors, top OCTG mills, top OFS, top drillers
UPDATE public.executives SET priority_tier = 1
WHERE company_name IN (
  'ExxonMobil','Chevron','Shell plc','BP plc','Equinor','Saudi Aramco','QatarEnergy',
  'Petronas','ONGC','Woodside Energy','Aker BP','Harbour Energy',
  'Tenaris S.A.','Vallourec S.A.','TMK (OAO TMK)','Hunting PLC','Interpipe',
  'United States Steel Corporation','Nippon Steel Corporation','JFE Holdings, Inc.',
  'Nucor Corporation','ArcelorMittal S.A.','POSCO (Pohang Iron & Steel Company)',
  'Schlumberger Ltd. (SLB)','Halliburton Company','Baker Hughes Company','NOV Inc.','Weatherford International plc',
  'Transocean Ltd.','Helmerich & Payne, Inc.','Patterson-UTI Energy, Inc.','Nabors Industries Ltd.',
  'Valaris Limited','Noble Corporation plc'
);

CREATE TABLE IF NOT EXISTS public.executive_change_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executive_id uuid NOT NULL,
  run_id uuid,
  change_type text NOT NULL, -- 'verified_no_change' | 'update' | 'replacement' | 'photo_refresh' | 'flag_inactive'
  current_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  proposed_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  diff jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric,
  sources jsonb DEFAULT '[]'::jsonb,
  reasoning text,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected | applied | superseded
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exec_proposals_status ON public.executive_change_proposals(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exec_proposals_exec ON public.executive_change_proposals(executive_id);
CREATE INDEX IF NOT EXISTS idx_exec_verification ON public.executives(priority_tier, last_verified_at NULLS FIRST) WHERE is_active = true;

ALTER TABLE public.executive_change_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Editors read exec proposals"
  ON public.executive_change_proposals FOR SELECT
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'));

CREATE POLICY "Admins update exec proposals"
  ON public.executive_change_proposals FOR UPDATE
  USING (has_role(auth.uid(),'admin'));

CREATE POLICY "Service role manages exec proposals"
  ON public.executive_change_proposals FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
