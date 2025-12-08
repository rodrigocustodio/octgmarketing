import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All 22 US-traded OCTG-related stocks with base prices for fallback
const US_TRADED_STOCKS = [
  // Americas - Direct US listings
  { symbol: 'X', name: 'U.S. Steel', region: 'Americas', basePrice: 42.50 },
  { symbol: 'CMC', name: 'Commercial Metals', region: 'Americas', basePrice: 52.00 },
  { symbol: 'NUE', name: 'Nucor', region: 'Americas', basePrice: 165.00 },
  { symbol: 'NOV', name: 'NOV Inc.', region: 'Americas', basePrice: 18.50 },
  { symbol: 'BKR', name: 'Baker Hughes', region: 'Americas', basePrice: 35.00 },
  { symbol: 'HAL', name: 'Halliburton', region: 'Americas', basePrice: 32.00 },
  { symbol: 'SLB', name: 'Schlumberger', region: 'Americas', basePrice: 48.00 },
  { symbol: 'WFRD', name: 'Weatherford', region: 'Americas', basePrice: 95.00 },
  { symbol: 'NBR', name: 'Nabors Industries', region: 'Americas', basePrice: 72.00 },
  { symbol: 'PTEN', name: 'Patterson-UTI', region: 'Americas', basePrice: 9.50 },
  { symbol: 'DO', name: 'Diamond Offshore', region: 'Americas', basePrice: 14.00 },
  { symbol: 'SDRL', name: 'Seadrill', region: 'Americas', basePrice: 42.00 },
  { symbol: 'VAL', name: 'Valaris', region: 'Americas', basePrice: 52.00 },
  { symbol: 'HP', name: 'Helmerich & Payne', region: 'Americas', basePrice: 34.00 },
  { symbol: 'PDS', name: 'Precision Drilling', region: 'Americas', basePrice: 58.00 },
  { symbol: 'NE', name: 'Noble Corp', region: 'Europe', basePrice: 38.00 },
  { symbol: 'RIG', name: 'Transocean', region: 'Europe', basePrice: 4.50 },
  
  // Europe - US ADR listings
  { symbol: 'TS', name: 'Tenaris', region: 'Europe', basePrice: 32.00 },
  { symbol: 'MT', name: 'ArcelorMittal', region: 'Europe', basePrice: 26.00 },
  
  // Asia-Pacific - US ADR listings  
  { symbol: 'PKX', name: 'POSCO', region: 'Asia-Pacific', basePrice: 68.00 },
];

// 15 International stocks (simulated pricing - not available on US exchanges)
const INTERNATIONAL_STOCKS = [
  // Europe - Non-US exchanges
  { symbol: 'VK.PA', name: 'Vallourec', region: 'Europe', basePrice: 16.50, currency: 'EUR' },
  { symbol: 'TRMK.ME', name: 'TMK', region: 'Europe', basePrice: 85.00, currency: 'RUB' },
  { symbol: 'SGSN.SW', name: 'SGS', region: 'Europe', basePrice: 89.00, currency: 'CHF' },
  { symbol: 'BVI.PA', name: 'Bureau Veritas', region: 'Europe', basePrice: 29.00, currency: 'EUR' },
  { symbol: 'ITRK.L', name: 'Intertek', region: 'Europe', basePrice: 42.00, currency: 'GBP' },
  { symbol: 'MAERSK-B.CO', name: 'Maersk', region: 'Europe', basePrice: 11500, currency: 'DKK' },
  { symbol: 'HLAG.DE', name: 'Hapag-Lloyd', region: 'Europe', basePrice: 145.00, currency: 'EUR' },
  
  // Asia-Pacific
  { symbol: '5411.T', name: 'JFE Holdings', region: 'Asia-Pacific', basePrice: 2100, currency: 'JPY' },
  { symbol: '5401.T', name: 'Nippon Steel', region: 'Asia-Pacific', basePrice: 3200, currency: 'JPY' },
  { symbol: '8053.T', name: 'Sumitomo Corp', region: 'Asia-Pacific', basePrice: 3800, currency: 'JPY' },
  { symbol: 'JINDALSTEL.NS', name: 'Jindal Steel', region: 'Asia-Pacific', basePrice: 950, currency: 'INR' },
  { symbol: '1199.HK', name: 'COSCO Ports', region: 'Asia-Pacific', basePrice: 5.20, currency: 'HKD' },
  { symbol: '1919.HK', name: 'COSCO Holdings', region: 'Asia-Pacific', basePrice: 11.50, currency: 'HKD' },
  
  // Australia
  { symbol: 'BSL.AX', name: 'BlueScope Steel', region: 'Australia', basePrice: 22.50, currency: 'AUD' },
  
  // Middle East
  { symbol: 'SABIC', name: 'SABIC', region: 'Middle East', basePrice: 82.00, currency: 'SAR' },
];

// Commodity indices (simulated with realistic data)
const COMMODITY_INDICES = [
  { symbol: 'HRC', name: 'Hot Rolled Coil', category: 'commodity', region: 'Global', basePrice: 720, currency: 'USD' },
  { symbol: 'CRC', name: 'Cold Rolled Coil', category: 'commodity', region: 'Global', basePrice: 850, currency: 'USD' },
  { symbol: 'SCRAP', name: 'Steel Scrap', category: 'commodity', region: 'Global', basePrice: 380, currency: 'USD' },
  { symbol: 'IRON', name: 'Iron Ore 62%', category: 'commodity', region: 'Global', basePrice: 105, currency: 'USD' },
  { symbol: 'BILLET', name: 'Steel Billet', category: 'commodity', region: 'Global', basePrice: 520, currency: 'USD' },
];

function generateSimulatedPrice(basePrice: number): { price: number; change: number; changePercent: number } {
  const changePercent = (Math.random() - 0.5) * 6; // ±3% daily variation
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const results: any[] = [];

    // Generate simulated prices for all US stocks
    // (Massive API requires upgraded plan - using simulation as fallback)
    console.log(`Generating prices for ${US_TRADED_STOCKS.length} US stocks...`);
    for (const stock of US_TRADED_STOCKS) {
      const priceData = generateSimulatedPrice(stock.basePrice);
      results.push({
        symbol: stock.symbol,
        name: stock.name,
        price: priceData.price,
        change: priceData.change,
        change_percent: priceData.changePercent,
        category: 'stock',
        region: stock.region,
        currency: 'USD',
      });
    }

    // Generate simulated prices for international stocks
    console.log(`Generating prices for ${INTERNATIONAL_STOCKS.length} international stocks...`);
    for (const stock of INTERNATIONAL_STOCKS) {
      const priceData = generateSimulatedPrice(stock.basePrice);
      results.push({
        symbol: stock.symbol,
        name: stock.name,
        price: priceData.price,
        change: priceData.change,
        change_percent: priceData.changePercent,
        category: 'stock',
        region: stock.region,
        currency: stock.currency,
      });
    }

    // Generate commodity prices
    console.log(`Generating prices for ${COMMODITY_INDICES.length} commodities...`);
    for (const commodity of COMMODITY_INDICES) {
      const priceData = generateSimulatedPrice(commodity.basePrice);
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

    const usStockCount = US_TRADED_STOCKS.length;
    const intlStockCount = INTERNATIONAL_STOCKS.length;
    const commodityCount = COMMODITY_INDICES.length;
    console.log(`Updated ${results.length} prices (${usStockCount} US stocks, ${intlStockCount} international stocks, ${commodityCount} commodities)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: results.length,
        usStocks: usStockCount,
        internationalStocks: intlStockCount,
        commodities: commodityCount,
        mode: 'simulated'
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
