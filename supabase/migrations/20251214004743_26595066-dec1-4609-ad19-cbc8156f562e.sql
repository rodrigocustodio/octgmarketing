-- Add 7 new categories to complete the official 30-category list
INSERT INTO topics (name, slug, description, icon) VALUES
('Offshore & Subsea', 'offshore-subsea', 'Offshore drilling platforms, subsea infrastructure, deepwater operations, and floating production systems', 'Anchor'),
('Onshore Operations', 'onshore-operations', 'Land-based drilling, shale developments, unconventional resources, and onshore production facilities', 'Mountain'),
('Mergers & Acquisitions', 'mergers-acquisitions', 'Industry M&A activity, corporate deals, acquisitions, divestitures, and strategic partnerships', 'GitMerge'),
('Earnings & Financials', 'earnings-financials', 'Company financial results, quarterly earnings, investor relations, and market capitalization news', 'DollarSign'),
('Energy Transition', 'energy-transition', 'Renewable energy integration, decarbonization initiatives, hydrogen projects, and sustainability efforts', 'Leaf'),
('Pipeline Infrastructure', 'pipeline-infrastructure', 'Pipeline projects, midstream operations, LNG terminals, and gas transmission networks', 'ArrowRightLeft'),
('Inspection & Quality', 'inspection-quality', 'QA/QC services, non-destructive testing, API certification, and quality assurance standards', 'Search')
ON CONFLICT (slug) DO NOTHING;