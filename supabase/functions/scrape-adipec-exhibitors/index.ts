import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalize company name for duplicate detection
function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[.,\-–—''""\(\)\[\]&]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/\b(inc|llc|ltd|limited|corp|corporation|co|company|plc|sa|gmbh|bv|nv|ag|srl|spa)\b/gi, '') // Remove legal suffixes
    .trim();
}

// Generate slug from company name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

// Parse company entries from markdown content
function parseCompaniesFromMarkdown(markdown: string): Array<{ name: string; country: string }> {
  const companies: Array<{ name: string; country: string }> = [];
  
  // Look for patterns like "Company Name | Country" or list items with company info
  const lines = markdown.split('\n');
  
  for (const line of lines) {
    // Skip empty lines or headers
    if (!line.trim() || line.startsWith('#')) continue;
    
    // Pattern 1: Table row format "| Company | Country |" or "Company | Country"
    if (line.includes('|')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p && p !== '-');
      if (parts.length >= 2) {
        const name = parts[0];
        const country = parts[1];
        // Skip header rows
        if (name.toLowerCase() !== 'company' && name.toLowerCase() !== 'exhibitor' && name.toLowerCase() !== 'name') {
          if (name.length > 1 && name.length < 200) {
            companies.push({ name, country: country || 'UAE' });
          }
        }
      }
      continue;
    }
    
    // Pattern 2: List items "- Company Name (Country)" or "* Company Name, Country"
    const listMatch = line.match(/^[\-\*•]\s*(.+?)(?:\s*[\(\,]\s*([A-Za-z\s]+)\)?)?$/);
    if (listMatch) {
      const name = listMatch[1].trim();
      const country = listMatch[2]?.trim() || 'UAE';
      if (name.length > 1 && name.length < 200) {
        companies.push({ name, country });
      }
      continue;
    }
    
    // Pattern 3: Plain text with common separators
    const separatorMatch = line.match(/^(.+?)\s*[-–—,]\s*([A-Za-z\s]{2,30})$/);
    if (separatorMatch) {
      const name = separatorMatch[1].trim();
      const country = separatorMatch[2].trim();
      if (name.length > 1 && name.length < 200) {
        companies.push({ name, country });
      }
    }
  }
  
  return companies;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user has admin/editor role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'editor'])
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin or editor role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting ADIPEC exhibitor scrape...');

    // Get Firecrawl API key
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch existing companies for duplicate detection
    console.log('Fetching existing companies for duplicate detection...');
    const { data: existingCompanies, error: fetchError } = await supabase
      .from('companies')
      .select('name, slug');

    if (fetchError) {
      console.error('Error fetching existing companies:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch existing companies' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create normalized set for duplicate detection
    const existingNamesSet = new Set(
      existingCompanies?.map(c => normalizeCompanyName(c.name)) || []
    );
    const existingSlugsSet = new Set(
      existingCompanies?.map(c => c.slug) || []
    );
    
    console.log(`Found ${existingCompanies?.length || 0} existing companies in database`);

    // Scrape ADIPEC exhibitor page using Firecrawl
    console.log('Scraping ADIPEC exhibitor list with Firecrawl...');
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.adipec.com/exhibition/exhibitor-list/',
        formats: ['markdown'],
        waitFor: 10000, // Wait 10 seconds for dynamic content to load
        onlyMainContent: true,
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('Firecrawl API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Firecrawl scrape failed: ${scrapeResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    
    console.log(`Received markdown content: ${markdown.length} characters`);
    
    if (!markdown || markdown.length < 100) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No content received from page. The page may require JavaScript rendering.',
          rawResponse: JSON.stringify(scrapeData).substring(0, 500)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse companies from markdown
    const scrapedCompanies = parseCompaniesFromMarkdown(markdown);
    console.log(`Parsed ${scrapedCompanies.length} company entries from content`);

    // Filter out duplicates
    const newCompanies: Array<{ name: string; country: string; slug: string }> = [];
    let duplicatesSkipped = 0;

    for (const company of scrapedCompanies) {
      const normalizedName = normalizeCompanyName(company.name);
      
      // Skip if already exists in database
      if (existingNamesSet.has(normalizedName)) {
        duplicatesSkipped++;
        continue;
      }
      
      // Skip if we've already added this in current batch
      if (newCompanies.some(c => normalizeCompanyName(c.name) === normalizedName)) {
        duplicatesSkipped++;
        continue;
      }
      
      // Generate unique slug
      let slug = generateSlug(company.name);
      let slugCounter = 1;
      while (existingSlugsSet.has(slug) || newCompanies.some(c => c.slug === slug)) {
        slug = `${generateSlug(company.name)}-${slugCounter}`;
        slugCounter++;
      }
      
      newCompanies.push({
        name: company.name,
        country: company.country,
        slug,
      });
    }

    console.log(`Found ${newCompanies.length} new companies to add, ${duplicatesSkipped} duplicates skipped`);

    // Insert new companies in batches
    let insertedCount = 0;
    const insertErrors: string[] = [];
    const BATCH_SIZE = 50;

    for (let i = 0; i < newCompanies.length; i += BATCH_SIZE) {
      const batch = newCompanies.slice(i, i + BATCH_SIZE);
      
      const { data: insertedData, error: insertError } = await supabase
        .from('companies')
        .insert(batch.map(c => ({
          name: c.name,
          slug: c.slug,
          country: c.country,
        })))
        .select('id');

      if (insertError) {
        console.error(`Batch insert error (${i}-${i + batch.length}):`, insertError);
        insertErrors.push(insertError.message);
      } else {
        insertedCount += insertedData?.length || 0;
      }
    }

    console.log(`Successfully inserted ${insertedCount} new companies`);

    return new Response(
      JSON.stringify({
        success: true,
        totalFound: scrapedCompanies.length,
        duplicatesSkipped,
        newCompaniesAdded: insertedCount,
        errors: insertErrors.length > 0 ? insertErrors : undefined,
        sampleCompanies: newCompanies.slice(0, 10).map(c => ({ name: c.name, country: c.country })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-adipec-exhibitors:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
