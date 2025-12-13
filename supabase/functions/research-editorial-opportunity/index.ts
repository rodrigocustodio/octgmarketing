import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roles } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const userRoles = roles?.map(r => r.role) || [];
    if (!userRoles.includes('admin') && !userRoles.includes('editor')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - admin or editor role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { region_name, topic_name, product_name } = await req.json();

    if (!region_name && !topic_name) {
      return new Response(
        JSON.stringify({ error: 'region_name or topic_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!PERPLEXITY_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Perplexity API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build search query
    let searchQuery = '';
    if (topic_name && region_name) {
      searchQuery = `${topic_name} ${region_name} OCTG oil gas energy industry news last 30 days`;
    } else if (topic_name) {
      searchQuery = `${topic_name} OCTG oil gas energy industry news last 30 days`;
    } else if (region_name) {
      searchQuery = `${region_name} OCTG oil gas energy industry news last 30 days`;
    }

    if (product_name) {
      searchQuery = `${product_name} OCTG ${searchQuery}`;
    }

    console.log('Searching Perplexity for:', searchQuery);

    // Call Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are an editorial research assistant for OCTG Index, an energy industry news platform. Your job is to find recent news and suggest article ideas.

IMPORTANT: Return your response as a JSON object with this exact structure:
{
  "ideas": [
    {
      "title": "Suggested article title",
      "description": "Brief description of what the article should cover (2-3 sentences)",
      "sources": ["Source name or URL 1", "Source name or URL 2"],
      "relevance": "Why this is relevant to OCTG/energy industry"
    }
  ]
}

Provide exactly 3 article ideas based on recent news. Focus on:
- News from the last 30 days
- OCTG-specific news first, then broader energy industry news
- Actionable, newsworthy topics
- Include real sources when possible`
          },
          {
            role: 'user',
            content: searchQuery
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];

    console.log('Perplexity response:', content);

    // Try to parse the JSON response
    let ideas = [];
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      const parsed = JSON.parse(jsonStr);
      ideas = parsed.ideas || [];
    } catch (e) {
      console.log('Failed to parse JSON, extracting manually');
      // Fallback: create a single idea from the raw content
      ideas = [{
        title: `${topic_name || 'Industry'} Update: ${region_name || 'Global'}`,
        description: content.slice(0, 300),
        sources: citations.slice(0, 3),
        relevance: 'Based on recent industry news'
      }];
    }

    // Add citations to each idea
    ideas = ideas.map((idea: any, index: number) => ({
      ...idea,
      sources: idea.sources?.length ? idea.sources : citations.slice(index * 2, (index + 1) * 2)
    }));

    return new Response(
      JSON.stringify({
        success: true,
        ideas,
        citations,
        query: searchQuery
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in research-editorial-opportunity:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});