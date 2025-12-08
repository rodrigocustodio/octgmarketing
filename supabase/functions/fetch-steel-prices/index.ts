import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All 22 US-traded OCTG-related stocks (fetched via Massive API)
const US_TRADED_STOCKS = [
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

    // Fetch all US-traded stocks from Massive API in a single batch call
    const symbols = US_TRADED_STOCKS.map(s => s.symbol).join(',');
    console.log(`Fetching ${US_TRADED_STOCKS.length} US stocks from Massive API...`);

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

    // Process Massive API response for US stocks
    if (data.tickers && Array.isArray(data.tickers)) {
      for (const ticker of data.tickers) {
        const stockInfo = US_TRADED_STOCKS.find(s => s.symbol === ticker.ticker);
        if (stockInfo && ticker.day) {
          results.push({
            symbol: ticker.ticker,
            name: stockInfo.name,
            price: ticker.day.c || ticker.prevDay?.c || 0,
            change: ticker.todaysChange || 0,
            change_percent: ticker.todaysChangePerc || 0,
            category: 'stock',
            region: stockInfo.region,
            currency: 'USD',
          });
        }
      }
    }

    console.log(`Successfully fetched ${results.length} US stock prices`);

    // Generate simulated prices for international stocks
    for (const stock of INTERNATIONAL_STOCKS) {
      const priceData = generateCommodityPrice(stock.basePrice);
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

    console.log(`Added ${INTERNATIONAL_STOCKS.length} international stock prices (simulated)`);

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

    const usStockCount = results.filter(r => r.category === 'stock' && r.currency === 'USD').length;
    const intlStockCount = results.filter(r => r.category === 'stock' && r.currency !== 'USD').length;
    console.log(`Updated ${results.length} prices (${usStockCount} US stocks, ${intlStockCount} international stocks, ${COMMODITY_INDICES.length} commodities)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: results.length,
        usStocks: usStockCount,
        internationalStocks: intlStockCount,
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
