import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIKey = Deno.env.get('OPENAI_API_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching current coverage data...');

    // Get current coverage stats
    const [regionsResult, topicsResult, companiesResult, articlesResult, articleTopicsResult, articleCompaniesResult] = await Promise.all([
      supabase.from('regions').select('id, name'),
      supabase.from('topics').select('id, name'),
      supabase.from('companies').select('id, name, industry_role').limit(100),
      supabase.from('articles').select('id, title, region_id, publish_date').in('status', ['published', 'featured']).order('publish_date', { ascending: false }).limit(50),
      supabase.from('article_topics').select('article_id, topic_id'),
      supabase.from('article_companies').select('article_id, company_id'),
    ]);

    const regions = regionsResult.data || [];
    const topics = topicsResult.data || [];
    const companies = companiesResult.data || [];
    const articles = articlesResult.data || [];
    const articleTopics = articleTopicsResult.data || [];
    const articleCompanies = articleCompaniesResult.data || [];

    // Calculate coverage gaps
    const regionCounts: Record<string, number> = {};
    const topicCounts: Record<string, number> = {};
    const companyCounts: Record<string, number> = {};

    regions.forEach(r => regionCounts[r.name] = 0);
    topics.forEach(t => topicCounts[t.name] = 0);
    companies.forEach(c => companyCounts[c.name] = 0);

    articles.forEach(article => {
      const region = regions.find(r => r.id === article.region_id);
      if (region) regionCounts[region.name]++;
    });

    articleTopics.forEach(at => {
      const topic = topics.find(t => t.id === at.topic_id);
      if (topic) topicCounts[topic.name]++;
    });

    articleCompanies.forEach(ac => {
      const company = companies.find(c => c.id === ac.company_id);
      if (company) companyCounts[company.name]++;
    });

    // Find gaps
    const lowCoverageRegions = Object.entries(regionCounts)
      .filter(([_, count]) => count < 5)
      .map(([name]) => name);

    const lowCoverageTopics = Object.entries(topicCounts)
      .filter(([_, count]) => count < 5)
      .map(([name]) => name);

    const unmentionedCompanies = companies
      .filter(c => !articleCompanies.some(ac => ac.company_id === c.id))
      .slice(0, 20)
      .map(c => c.name);

    // Fetch trending news using Firecrawl (if available)
    let trendingNews = '';
    if (firecrawlKey) {
      try {
        console.log('Fetching trending OCTG news...');
        const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'OCTG oil gas drilling pipe steel tube news 2024 2025',
            limit: 10,
            tbs: 'qdr:w', // Last week
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.data) {
            trendingNews = searchData.data
              .map((item: any) => `- ${item.title}: ${item.description || ''}`)
              .join('\n');
          }
        }
      } catch (e) {
        console.log('Firecrawl search skipped:', e);
      }
    }

    // Generate suggestions using AI
    const prompt = `You are an editorial strategist for OCTG Index, a news site covering oil country tubular goods (OCTG), steel pipes, drilling, and energy industry.

CURRENT COVERAGE ANALYSIS:
- Low coverage regions: ${lowCoverageRegions.join(', ') || 'None'}
- Low coverage topics: ${lowCoverageTopics.join(', ') || 'None'}
- Major companies never mentioned: ${unmentionedCompanies.join(', ') || 'None'}

RECENT INDUSTRY NEWS:
${trendingNews || 'No recent news available'}

YOUR TASK:
Generate 5 unique, high-value article topic suggestions that will:
1. Fill coverage gaps (prioritize low-coverage regions/topics)
2. Feature unmentioned major companies
3. Capitalize on current industry trends
4. Have strong SEO potential
5. Provide business value to readers

For each suggestion, provide:
- title: A compelling article headline (50-70 chars)
- description: Brief explanation of the article angle (100-150 chars)
- region: Target region from [Global, Americas, Europe, Asia-Pacific, Middle East, Africa, Australia]
- seo_score: 1-100 based on search potential
- business_score: 1-100 based on industry relevance

Respond in JSON format:
{
  "suggestions": [
    {
      "title": "...",
      "description": "...",
      "region": "...",
      "seo_score": 75,
      "business_score": 80
    }
  ]
}`;

    console.log('Generating AI suggestions...');
    
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert editorial strategist. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Parse JSON from response
    let suggestions;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]).suggestions;
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI suggestions');
    }

    console.log(`Generated ${suggestions.length} suggestions`);

    // Map region names to IDs
    const regionMap = new Map(regions.map(r => [r.name.toLowerCase(), r.id]));

    // Insert suggestions into database
    const insertData = suggestions.map((s: any) => ({
      title: s.title,
      description: s.description,
      suggestion_type: 'topic',
      target_region_id: regionMap.get(s.region?.toLowerCase()) || null,
      seo_score: s.seo_score || 50,
      business_score: s.business_score || 50,
      status: 'pending',
      source: 'ai',
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('editorial_suggestions')
      .insert(insertData)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log(`Inserted ${inserted?.length} suggestions`);

    return new Response(
      JSON.stringify({ success: true, suggestions: inserted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating suggestions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
