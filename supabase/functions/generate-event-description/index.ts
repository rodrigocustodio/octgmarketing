import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventName, location, website, venue, startDate, endDate } = await req.json();

    if (!eventName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Event name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!firecrawlKey || !openaiKey) {
      console.error('Missing API keys');
      return new Response(
        JSON.stringify({ success: false, error: 'API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Researching event:', eventName);

    // Extract year from event name or start date
    const yearMatch = eventName.match(/20\d{2}/);
    const year = yearMatch ? yearMatch[0] : new Date(startDate || Date.now()).getFullYear();

    // Search for event information
    const searchQueries = [
      `"${eventName}" ${year} oil gas energy conference exhibition attendees exhibitors`,
      `"${eventName}" energy industry event program speakers themes`,
    ];

    let researchContent = '';

    for (const query of searchQueries) {
      try {
        console.log('Searching:', query);
        const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            limit: 5,
            scrapeOptions: { formats: ['markdown'] },
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.data) {
            for (const result of searchData.data) {
              if (result.markdown) {
                researchContent += `\n\n--- Source: ${result.url} ---\n${result.markdown.slice(0, 2000)}`;
              }
            }
          }
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    }

    // Scrape official website if provided
    if (website) {
      try {
        console.log('Scraping official website:', website);
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: website,
            formats: ['markdown'],
            onlyMainContent: true,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          if (scrapeData.data?.markdown) {
            researchContent += `\n\n--- Official Website ---\n${scrapeData.data.markdown.slice(0, 3000)}`;
          }
        }
      } catch (error) {
        console.error('Website scrape error:', error);
      }
    }

    console.log('Research content length:', researchContent.length);

    // Generate description with OpenAI
    const systemPrompt = `You are an expert energy industry event researcher. Generate a comprehensive, professional description for an energy industry event.

REQUIREMENTS:
- Write exactly 800-1000 characters (approximately 3-4 short paragraphs)
- Structure the description as follows:
  1. Opening: Event significance, scale, and industry position (1-2 sentences)
  2. What to Expect: Key activities - exhibitions, conferences, technology showcases, networking (2-3 sentences)
  3. Who Attends: Target audience - NOCs, IOCs, OCTG manufacturers, service companies, policymakers (1-2 sentences)
  4. Impact: Industry influence, deal-making opportunities, innovation focus (1-2 sentences)

STYLE:
- Professional corporate tone suitable for a news publication
- Include specific numbers when available (exhibitor counts, attendee numbers, floor space)
- NO markdown formatting - plain text paragraphs only
- NO bullet points or headers
- Focus on energy/oil & gas/OCTG industry relevance
- Make it compelling for potential attendees and exhibitors

OUTPUT: Return ONLY the description text, nothing else.`;

    const userPrompt = `Generate a professional description for this energy industry event:

Event Name: ${eventName}
Location: ${location || 'Not specified'}
Venue: ${venue || 'Not specified'}
Dates: ${startDate ? `${startDate}${endDate ? ` to ${endDate}` : ''}` : 'Not specified'}

Research findings:
${researchContent.slice(0, 8000) || 'No research data available. Generate based on event name and common industry event features.'}`;

    console.log('Generating description with OpenAI...');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI error:', errorData);
      throw new Error('Failed to generate description');
    }

    const openaiData = await openaiResponse.json();
    const description = openaiData.choices[0].message.content.trim();

    console.log('Generated description length:', description.length);

    return new Response(
      JSON.stringify({ success: true, description }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating event description:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate description';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
