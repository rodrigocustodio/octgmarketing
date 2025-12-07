-- Create scrape_sources table to store news source configurations
CREATE TABLE public.scrape_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL DEFAULT 'Global',
  category TEXT NOT NULL,
  source_type TEXT DEFAULT 'HTML',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100,
  last_scraped_at TIMESTAMPTZ,
  articles_found INTEGER DEFAULT 0,
  scrape_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scrape_sources ENABLE ROW LEVEL SECURITY;

-- Anyone can view sources
CREATE POLICY "Anyone can view scrape_sources"
ON public.scrape_sources
FOR SELECT
USING (true);

-- Admins can manage sources
CREATE POLICY "Admins can manage scrape_sources"
ON public.scrape_sources
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_scrape_sources_updated_at
BEFORE UPDATE ON public.scrape_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial sources data
INSERT INTO public.scrape_sources (name, url, region, category, source_type, priority) VALUES
-- Mills & Manufacturing (priority 10)
('Tenaris Newsroom', 'https://www.tenaris.com/en/news/', 'Global', 'Mills & Manufacturing', 'HTML', 10),
('Vallourec Media News', 'https://www.vallourec.com/en/media/news', 'Global', 'Mills & Manufacturing', 'HTML', 10),
('Nippon Steel News', 'https://www.nipponsteel.com/en/news/', 'Asia-Pacific', 'Mills & Manufacturing', 'HTML', 10),
('JFE Steel Press Releases', 'https://www.jfe-steel.co.jp/en/release/', 'Asia-Pacific', 'Mills & Manufacturing', 'HTML', 10),
('TMK Press Center', 'https://www.tmk-group.com/PressCenter', 'Europe', 'Mills & Manufacturing', 'HTML', 10),
('U.S. Steel Newsroom', 'https://www.ussteel.com/media/newsroom', 'Americas', 'Mills & Manufacturing', 'HTML', 10),
('voestalpine Tubulars News', 'https://www.voestalpine.com/tubulars/en/news/', 'Europe', 'Mills & Manufacturing', 'HTML', 10),
('ArcelorMittal Tubular News', 'https://tubular.arcelormittal.com/news', 'Global', 'Mills & Manufacturing', 'HTML', 10),
('SeAH Steel News', 'https://www.seahsteel.co.kr/en/news/', 'Asia-Pacific', 'Mills & Manufacturing', 'HTML', 10),
('Maharashtra Seamless', 'https://www.maharashtraseamless.com/news.html', 'Asia-Pacific', 'Mills & Manufacturing', 'HTML', 10),
('Jindal SAW Media', 'https://www.jindalsaw.com/media', 'Asia-Pacific', 'Mills & Manufacturing', 'HTML', 10),

-- E&P Companies (priority 20)
('Saudi Aramco News', 'https://www.aramco.com/en/news', 'Middle East', 'E&P', 'HTML', 20),
('ADNOC Media Center', 'https://www.adnoc.ae/media-centre', 'Middle East', 'E&P', 'HTML', 20),
('QatarEnergy News', 'https://www.qatarenergy.qa/en/Media', 'Middle East', 'E&P', 'HTML', 20),
('Petrobras News', 'https://petrobras.com/en/news/', 'Americas', 'E&P', 'HTML', 20),
('ExxonMobil News', 'https://corporate.exxonmobil.com/news', 'Global', 'E&P', 'HTML', 20),
('Chevron Newsroom', 'https://www.chevron.com/newsroom', 'Global', 'E&P', 'HTML', 20),
('Shell News', 'https://www.shell.com/media.html', 'Global', 'E&P', 'HTML', 20),
('TotalEnergies News', 'https://totalenergies.com/media/news', 'Global', 'E&P', 'HTML', 20),

-- Rigs & Drilling (priority 30)
('Baker Hughes Rig Count', 'https://rigcount.bakerhughes.com', 'Global', 'Rigs & Drilling', 'HTML', 30),
('Rigzone News', 'https://www.rigzone.com/news/', 'Global', 'Rigs & Drilling', 'HTML', 30),
('Nabors News', 'https://www.nabors.com/news', 'Global', 'Drilling Contractors', 'HTML', 30),
('Transocean News', 'https://www.deepwater.com/news', 'Global', 'Offshore Rigs', 'HTML', 30),
('Halliburton News', 'https://www.halliburton.com/en/news', 'Global', 'Oilfield Services', 'HTML', 30),
('SLB (Schlumberger)', 'https://www.slb.com/news', 'Global', 'Oilfield Services', 'HTML', 30),

-- Industry Media (priority 5 - highest importance)
('Upstream Online', 'https://www.upstreamonline.com/', 'Global', 'Industry Media', 'HTML', 5),
('World Oil', 'https://www.worldoil.com/news/', 'Global', 'Industry Media', 'HTML', 5),
('Oil & Gas Journal', 'https://www.ogj.com/', 'Global', 'Industry Media', 'HTML', 5),
('Offshore Technology', 'https://www.offshore-technology.com/news/', 'Global', 'Industry Media', 'HTML', 5),
('Energy Voice', 'https://www.energyvoice.com/', 'Europe', 'Industry Media', 'HTML', 5),
('Reuters Energy', 'https://www.reuters.com/business/energy/', 'Global', 'Industry Media', 'HTML', 5),
('Bloomberg Energy', 'https://www.bloomberg.com/energy', 'Global', 'Industry Media', 'HTML', 5),

-- Steel & Pricing (priority 40)
('SteelOrbis', 'https://www.steelorbis.com/', 'Global', 'Steel & Pricing', 'HTML', 40),
('FastMarkets', 'https://www.fastmarkets.com/', 'Global', 'Steel & Pricing', 'HTML', 40),
('SteelBenchmarker', 'http://www.steelbenchmarker.com', 'Global', 'Steel & Pricing', 'HTML', 40),

-- Logistics & Ports (priority 50)
('Supply Chain Digital', 'https://www.supplychaindigital.com/', 'Global', 'Logistics & Ports', 'HTML', 50),
('Port of Houston News', 'https://www.porthouston.com/news/', 'Americas', 'Logistics & Ports', 'HTML', 50),
('Port of Rotterdam News', 'https://www.portofrotterdam.com/en/news', 'Europe', 'Logistics & Ports', 'HTML', 50),

-- Regulatory (priority 60)
('US ITC', 'https://www.usitc.gov/', 'Americas', 'Regulatory', 'HTML', 60),
('EU Trade Commission', 'https://policy.trade.ec.europa.eu/', 'Europe', 'Regulatory', 'HTML', 60),
('India DGTR', 'https://www.dgtr.gov.in/', 'Asia-Pacific', 'Regulatory', 'HTML', 60),

-- Regional News (priority 15)
('BNAmericas Oil & Gas', 'https://www.bnamericas.com/en/', 'Americas', 'Regional News', 'HTML', 15),
('BOE Report Canada', 'https://boereport.com/', 'Americas', 'Regional News', 'HTML', 15),
('MEED Oil & Gas', 'https://www.meed.com/', 'Middle East', 'Regional News', 'HTML', 15),
('Africa Oil & Gas Report', 'https://africaoilgasreport.com/', 'Africa', 'Regional News', 'HTML', 15);