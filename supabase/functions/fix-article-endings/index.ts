import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const SYSTEM_PROMPT = `You are an expert editor. Your task is to replace generic AI-sounding section headers with creative, contextual alternatives.

Given an article's title and body, identify any section header that uses "Conclusion", "Summary", "Final Thoughts", "In Conclusion", "To Conclude", or "Wrapping Up" and replace it with a creative, article-specific header.

Choose from alternatives like:
- "The Path Forward" (for strategy pieces)
- "What This Means for [Industry/Market/Region]" (customize based on article topic)
- "Industry Outlook" / "Market Outlook" / "Regional Outlook"
- "Strategic Implications"
- "Looking Ahead" / "Road Ahead"
- "The Bigger Picture"
- "[Topic] Momentum Continues"
- "Shaping the Future"
- "Beyond the Headlines"
- "Setting the Stage"

Or create a unique header that fits the article's specific topic and tone.

Return ONLY the new header text (without the ## or ### prefix). Do not return anything else.`;

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

    // Check user role
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

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Parse request body
    const { table = 'both', dryRun = false } = await req.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Pattern to find "Conclusion" headers
    const conclusionPattern = /^(#{2,3})\s*(Conclusion|Summary|Final Thoughts|In Conclusion|To Conclude|Wrapping Up)\s*$/gmi;

    const results: {
      articles: { id: string; title: string; oldHeader: string; newHeader: string; status: string }[];
      drafts: { id: string; title: string; oldHeader: string; newHeader: string; status: string }[];
    } = { articles: [], drafts: [] };

    // Process published articles
    if (table === 'articles' || table === 'both') {
      const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select('id, title, body')
        .not('body', 'is', null);

      if (articlesError) {
        console.error('Error fetching articles:', articlesError);
      } else if (articles) {
        for (const article of articles) {
          if (!article.body) continue;
          
          const matches = article.body.match(conclusionPattern);
          if (!matches || matches.length === 0) continue;

          const oldHeader = matches[0];
          console.log(`Found "${oldHeader}" in article: ${article.title}`);

          // Generate new header using OpenAI
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { 
                  role: 'user', 
                  content: `Article Title: ${article.title}\n\nArticle excerpt (last 500 chars):\n${article.body.slice(-500)}\n\nReplace this header: "${oldHeader}"\n\nProvide a creative, contextual replacement header.`
                }
              ],
              temperature: 0.8,
              max_tokens: 50,
            }),
          });

          if (!response.ok) {
            console.error(`OpenAI error for article ${article.id}`);
            results.articles.push({ id: article.id, title: article.title, oldHeader, newHeader: '', status: 'api_error' });
            continue;
          }

          const data = await response.json();
          let newHeader = data.choices[0]?.message?.content?.trim() || 'Looking Ahead';
          
          // Clean up the response (remove quotes if present)
          newHeader = newHeader.replace(/^["']|["']$/g, '');

          // Preserve the original markdown header level
          const headerLevel = oldHeader.match(/^(#{2,3})/)?.[1] || '##';
          const newFullHeader = `${headerLevel} ${newHeader}`;
          
          if (!dryRun) {
            const newBody = article.body.replace(conclusionPattern, newFullHeader);
            
            const { error: updateError } = await supabase
              .from('articles')
              .update({ body: newBody })
              .eq('id', article.id);

            if (updateError) {
              console.error(`Error updating article ${article.id}:`, updateError);
              results.articles.push({ id: article.id, title: article.title, oldHeader, newHeader, status: 'update_error' });
            } else {
              console.log(`Updated article ${article.id}: "${oldHeader}" -> "${newFullHeader}"`);
              results.articles.push({ id: article.id, title: article.title, oldHeader, newHeader, status: 'updated' });
            }
          } else {
            results.articles.push({ id: article.id, title: article.title, oldHeader, newHeader, status: 'dry_run' });
          }
        }
      }
    }

    // Process draft articles
    if (table === 'drafts' || table === 'both') {
      const { data: drafts, error: draftsError } = await supabase
        .from('draft_articles')
        .select('id, title, body_markdown')
        .not('body_markdown', 'is', null);

      if (draftsError) {
        console.error('Error fetching drafts:', draftsError);
      } else if (drafts) {
        for (const draft of drafts) {
          if (!draft.body_markdown) continue;
          
          const matches = draft.body_markdown.match(conclusionPattern);
          if (!matches || matches.length === 0) continue;

          const oldHeader = matches[0];
          console.log(`Found "${oldHeader}" in draft: ${draft.title}`);

          // Generate new header using OpenAI
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { 
                  role: 'user', 
                  content: `Article Title: ${draft.title}\n\nArticle excerpt (last 500 chars):\n${draft.body_markdown.slice(-500)}\n\nReplace this header: "${oldHeader}"\n\nProvide a creative, contextual replacement header.`
                }
              ],
              temperature: 0.8,
              max_tokens: 50,
            }),
          });

          if (!response.ok) {
            console.error(`OpenAI error for draft ${draft.id}`);
            results.drafts.push({ id: draft.id, title: draft.title, oldHeader, newHeader: '', status: 'api_error' });
            continue;
          }

          const data = await response.json();
          let newHeader = data.choices[0]?.message?.content?.trim() || 'Looking Ahead';
          
          // Clean up the response
          newHeader = newHeader.replace(/^["']|["']$/g, '');

          // Preserve the original markdown header level
          const headerLevel = oldHeader.match(/^(#{2,3})/)?.[1] || '##';
          const newFullHeader = `${headerLevel} ${newHeader}`;
          
          if (!dryRun) {
            const newBody = draft.body_markdown.replace(conclusionPattern, newFullHeader);
            
            const { error: updateError } = await supabase
              .from('draft_articles')
              .update({ body_markdown: newBody })
              .eq('id', draft.id);

            if (updateError) {
              console.error(`Error updating draft ${draft.id}:`, updateError);
              results.drafts.push({ id: draft.id, title: draft.title, oldHeader, newHeader, status: 'update_error' });
            } else {
              console.log(`Updated draft ${draft.id}: "${oldHeader}" -> "${newFullHeader}"`);
              results.drafts.push({ id: draft.id, title: draft.title, oldHeader, newHeader, status: 'updated' });
            }
          } else {
            results.drafts.push({ id: draft.id, title: draft.title, oldHeader, newHeader, status: 'dry_run' });
          }
        }
      }
    }

    const summary = {
      articlesFixed: results.articles.filter(r => r.status === 'updated').length,
      draftsFixed: results.drafts.filter(r => r.status === 'updated').length,
      totalFixed: results.articles.filter(r => r.status === 'updated').length + results.drafts.filter(r => r.status === 'updated').length,
      dryRun,
      details: results
    };

    console.log('Fix article endings completed:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fix-article-endings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
