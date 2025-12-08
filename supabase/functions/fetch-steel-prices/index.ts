import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All 22 US-traded OCTG-related stocks
const OCTG_STOCKS = [
  // Americas - Direct US listings
  { symbol: 'X', name: 'U.S. Steel', region: 'Americas' },
  { symbol: 'CMC', name: 'Commercial Metals', region: 'Americas' },
  { symbol: 'NUE', name: 'Nucor', region: 'Americas' },
  { symbol: 'NOV', name: 'NOV Inc.', region: 'Americas' },
  { symbol: 'BKR', name: 'Baker Hughes', region: 'Americas' },
  { symbol: 'HAL', name: 'Halliburton', region: 'Americas' },
  { symbol: 'SLB', name: 'Schlumberger', region: 'Americas' },
  { symbol: 'WFRD', name: 'Weatherford', region: 'Americas' },
  { symbol: 'NBR', name: 'Nabors Industries', region: 'Americas' },
  { symbol: 'PTEN', name: 'Patterson-UTI', region: 'Americas' },
  { symbol: 'DO', name: 'Diamond Offshore', region: 'Americas' },
  { symbol: 'SDRL', name: 'Seadrill', region: 'Americas' },
  { symbol: 'VAL', name: 'Valaris', region: 'Americas' },
  { symbol: 'HP', name: 'Helmerich & Payne', region: 'Americas' },
  { symbol: 'PDS', name: 'Precision Drilling', region: 'Americas' },
  { symbol: 'ORCL', name: 'Oracle', region: 'Americas' },
  { symbol: 'NE', name: 'Noble Corp', region: 'Europe' },
  { symbol: 'RIG', name: 'Transocean', region: 'Europe' },
  
  // Europe - US ADR listings
  { symbol: 'TS', name: 'Tenaris', region: 'Europe' },
  { symbol: 'MT', name: 'ArcelorMittal', region: 'Europe' },
  { symbol: 'SAP', name: 'SAP SE', region: 'Europe' },
  
  // Asia-Pacific - US ADR listings  
  { symbol: 'PKX', name: 'POSCO', region: 'Asia-Pacific' },
];

// Commodity indices (simulated with realistic data)
const COMMODITY_INDICES = [
  { symbol: 'HRC', name: 'Hot Rolled Coil', category: 'commodity', region: 'Global', basePrice: 720, currency: 'USD' },
  { symbol: 'CRC', name: 'Cold Rolled Coil', category: 'commodity', region: 'Global', basePrice: 850, currency: 'USD' },
  { symbol: 'SCRAP', name: 'Steel Scrap', category: 'commodity', region: 'Global', basePrice: 380, currency: 'USD' },
  { symbol: 'IRON', name: 'Iron Ore 62%', category: 'commodity', region: 'Global', basePrice: 105, currency: 'USD' },
  { symbol: 'BILLET', name: 'Steel Billet', category: 'commodity', region: 'Global', basePrice: 520, currency: 'USD' },
];

function generateCommodityPrice(basePrice: number): { price: number; change: number; changePercent: number } {
  const changePercent = (Math.random() - 0.5) * 6;
  const change = basePrice * (changePercent / 100);
  const price = basePrice + change;
  
  return {
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const massiveApiKey = Deno.env.get('MASSIVE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!massiveApiKey) {
      throw new Error('MASSIVE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const results: any[] = [];

    // Fetch all stocks from Massive API in a single batch call
    const symbols = OCTG_STOCKS.map(s => s.symbol).join(',');
    console.log(`Fetching ${OCTG_STOCKS.length} stocks from Massive API...`);

    const response = await fetch(
      `https://api.massive.com/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${symbols}`,
      {
        headers: {
          'Authorization': `Bearer ${massiveApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Massive API error:', response.status, errorText);
      throw new Error(`Massive API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Massive API response:', JSON.stringify(data).slice(0, 500));

    // Process Massive API response
    if (data.tickers && Array.isArray(data.tickers)) {
      for (const ticker of data.tickers) {
        const stockInfo = OCTG_STOCKS.find(s => s.symbol === ticker.ticker);
        if (stockInfo && ticker.day) {
          results.push({
            symbol: ticker.ticker,
            name: stockInfo.name,
            price: ticker.day.c || ticker.prevDay?.c || 0, // Current close or previous close
            change: ticker.todaysChange || 0,
            change_percent: ticker.todaysChangePerc || 0,
            category: 'stock',
            region: stockInfo.region,
            currency: 'USD',
          });
        }
      }
    }

    console.log(`Successfully fetched ${results.length} stock prices`);

    // Generate commodity prices (simulated)
    for (const commodity of COMMODITY_INDICES) {
      const priceData = generateCommodityPrice(commodity.basePrice);
      results.push({
        symbol: commodity.symbol,
        name: commodity.name,
        price: priceData.price,
        change: priceData.change,
        change_percent: priceData.changePercent,
        category: commodity.category,
        region: commodity.region,
        currency: commodity.currency,
      });
    }

    // Upsert all prices to database
    if (results.length > 0) {
      const { error } = await supabase
        .from('steel_prices')
        .upsert(results, { onConflict: 'symbol' });

      if (error) {
        console.error('Database upsert error:', error);
        throw error;
      }
    }

    console.log(`Updated ${results.length} prices (${results.length - COMMODITY_INDICES.length} stocks, ${COMMODITY_INDICES.length} commodities)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: results.length,
        stocks: results.length - COMMODITY_INDICES.length,
        commodities: COMMODITY_INDICES.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-steel-prices:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
