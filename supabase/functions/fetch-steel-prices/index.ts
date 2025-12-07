import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Steel and OCTG related stock symbols
const STOCK_SYMBOLS = [
  { symbol: 'TS', name: 'Tenaris', category: 'stock', region: 'Americas' },
  { symbol: 'X', name: 'U.S. Steel', category: 'stock', region: 'Americas' },
  { symbol: 'NUE', name: 'Nucor', category: 'stock', region: 'Americas' },
  { symbol: 'STLD', name: 'Steel Dynamics', category: 'stock', region: 'Americas' },
  { symbol: 'CLF', name: 'Cleveland-Cliffs', category: 'stock', region: 'Americas' },
  { symbol: 'MT', name: 'ArcelorMittal', category: 'stock', region: 'Europe' },
  { symbol: 'PKX', name: 'POSCO', category: 'stock', region: 'Asia-Pacific' },
  { symbol: 'VALE', name: 'Vale S.A.', category: 'stock', region: 'Americas' },
  { symbol: 'RIO', name: 'Rio Tinto', category: 'stock', region: 'Australia' },
  { symbol: 'BHP', name: 'BHP Group', category: 'stock', region: 'Australia' },
];

// Commodity indices (we'll simulate these with realistic data)
const COMMODITY_INDICES = [
  { symbol: 'HRC', name: 'Hot Rolled Coil', category: 'commodity', region: 'Global', basePrice: 720, currency: 'USD' },
  { symbol: 'CRC', name: 'Cold Rolled Coil', category: 'commodity', region: 'Global', basePrice: 850, currency: 'USD' },
  { symbol: 'SCRAP', name: 'Steel Scrap', category: 'commodity', region: 'Global', basePrice: 380, currency: 'USD' },
  { symbol: 'IRON', name: 'Iron Ore 62%', category: 'commodity', region: 'Global', basePrice: 105, currency: 'USD' },
  { symbol: 'BILLET', name: 'Steel Billet', category: 'commodity', region: 'Global', basePrice: 520, currency: 'USD' },
];

async function fetchStockPrice(symbol: string, apiKey: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    );
    const data = await response.json();
    
    if (data['Global Quote'] && data['Global Quote']['05. price']) {
      const quote = data['Global Quote'];
      return {
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      };
    }
    console.log(`No data for ${symbol}:`, data);
    return null;
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

function generateCommodityPrice(basePrice: number): { price: number; change: number; changePercent: number } {
  // Generate realistic daily fluctuation (-3% to +3%)
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
    const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: any[] = [];
    let stocksFetched = 0;
    const maxStocksToFetch = 5; // Alpha Vantage free tier limit

    // Fetch real stock prices (limited by API rate)
    if (alphaVantageKey) {
      for (const stock of STOCK_SYMBOLS.slice(0, maxStocksToFetch)) {
        const priceData = await fetchStockPrice(stock.symbol, alphaVantageKey);
        
        if (priceData) {
          results.push({
            symbol: stock.symbol,
            name: stock.name,
            price: priceData.price,
            change: priceData.change,
            change_percent: priceData.changePercent,
            category: stock.category,
            region: stock.region,
            currency: 'USD',
          });
          stocksFetched++;
        }
        
        // Rate limiting: wait 12 seconds between calls (5 calls/minute for free tier)
        if (stocksFetched < maxStocksToFetch) {
          await new Promise(resolve => setTimeout(resolve, 12000));
        }
      }
    }

    // Generate commodity prices (simulated but realistic)
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

    console.log(`Updated ${results.length} prices (${stocksFetched} stocks, ${COMMODITY_INDICES.length} commodities)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: results.length,
        stocks: stocksFetched,
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
