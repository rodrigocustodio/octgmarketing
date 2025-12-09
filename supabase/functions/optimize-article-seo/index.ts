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

const TITLE_PROMPT = `You are an SEO expert. Rewrite this article title for optimal SEO:

REQUIREMENTS:
- MAXIMUM 50 characters (strict limit - count carefully!)
- Front-load the most important keyword
- Use action verbs where possible  
- Remove filler words (the, and, for, in, with, etc.)
- Keep company/brand names only if they are the main subject
- Make it punchy, scannable, and compelling
- Preserve the core meaning and news value

Examples:
- "Aramco and Pasqal Launch Saudi Arabia's First Quantum Computer: A Milestone" → "Aramco Deploys Saudi's First Quantum Computer"
- "Sumitomo Reports Strong Financials Amidst North American OCTG Demand Challenges" → "Sumitomo Profits Rise Despite OCTG Slump"
- "OCTG Connectors Market Set for Robust Growth Driven by Industry Dynamics" → "OCTG Connectors Market Eyes Strong Growth"

Return ONLY the optimized title, nothing else.`;

const SUBTITLE_PROMPT = `You are an SEO expert. Rewrite this meta description for optimal SEO:

REQUIREMENTS:
- EXACTLY 120-150 characters (strict range - count carefully!)
- Include primary keyword within first 70 characters
- Summarize the key news value concisely
- Add a hook or benefit statement
- Make it compelling for search results
- No quotes or special formatting

Return ONLY the optimized description, nothing else.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
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
        JSON.stringify({ error: 'Unauthorized - admin/editor role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { articleId, draftId, mode = 'single', table = 'articles' } = await req.json();

    // Determine which table to use
    const targetTable = draftId ? 'draft_articles' : table;
    const targetId = draftId || articleId;
    const subtitleField = targetTable === 'draft_articles' ? 'excerpt' : 'subtitle';

    interface ArticleToProcess {
      id: string;
      title: string;
      subtitle: string | null;
    }

    let articlesToProcess: ArticleToProcess[] = [];

    if (mode === 'bulk') {
      // Fetch all items with title > 60 chars or subtitle/excerpt not in range
      const { data, error } = await supabase
        .from(targetTable)
        .select(`id, title, ${subtitleField}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      articlesToProcess = (data || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        subtitle: a[subtitleField]
      })).filter((a: ArticleToProcess) => 
        a.title.length > 60 || 
        !a.subtitle || 
        a.subtitle.length < 120 || 
        a.subtitle.length > 155
      );
    } else if (targetId) {
      const { data, error } = await supabase
        .from(targetTable)
        .select(`id, title, ${subtitleField}`)
        .eq('id', targetId)
        .single();

      if (error) throw error;
      if (data) {
        articlesToProcess = [{
          id: data.id,
          title: data.title,
          subtitle: (data as any)[subtitleField]
        }];
      }
    }

    console.log(`Processing ${articlesToProcess.length} articles for SEO optimization`);

    const results = [];

    for (const article of articlesToProcess) {
      try {
        let newTitle = article.title;
        let newSubtitle = article.subtitle;

        // Optimize title if needed
        if (article.title.length > 60) {
          console.log(`Optimizing title for article ${article.id}: "${article.title}" (${article.title.length} chars)`);
          
          const titleResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: TITLE_PROMPT },
                { role: 'user', content: article.title }
              ],
              temperature: 0.3,
              max_tokens: 100,
            }),
          });

          if (!titleResponse.ok) {
            throw new Error(`OpenAI API error: ${titleResponse.status}`);
          }

          const titleData = await titleResponse.json();
          newTitle = titleData.choices[0]?.message?.content?.trim() || article.title;
          
          // Ensure title is under limit
          if (newTitle.length > 60) {
            newTitle = newTitle.substring(0, 57) + '...';
          }
        }

        // Optimize subtitle if needed
        if (!article.subtitle || article.subtitle.length < 120 || article.subtitle.length > 155) {
          const subtitleContent = article.subtitle || article.title;
          console.log(`Optimizing subtitle for article ${article.id}`);
          
          const subtitleResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: SUBTITLE_PROMPT },
                { role: 'user', content: subtitleContent }
              ],
              temperature: 0.3,
              max_tokens: 200,
            }),
          });

          if (!subtitleResponse.ok) {
            throw new Error(`OpenAI API error: ${subtitleResponse.status}`);
          }

          const subtitleData = await subtitleResponse.json();
          newSubtitle = subtitleData.choices[0]?.message?.content?.trim() || article.subtitle;
          
          // Ensure subtitle is in range
          if (newSubtitle && newSubtitle.length > 155) {
            newSubtitle = newSubtitle.substring(0, 152) + '...';
          }
        }

        // Update article/draft
        const updateData: Record<string, any> = {
          title: newTitle,
          updated_at: new Date().toISOString()
        };
        updateData[subtitleField] = newSubtitle;

        const { error: updateError } = await supabase
          .from(targetTable)
          .update(updateData)
          .eq('id', article.id);

        if (updateError) throw updateError;

        results.push({
          id: article.id,
          status: 'success',
          originalTitle: article.title,
          newTitle,
          titleChange: article.title !== newTitle,
          originalSubtitle: article.subtitle,
          newSubtitle,
          subtitleChange: article.subtitle !== newSubtitle
        });

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Error processing article ${article.id}:`, err);
        results.push({
          id: article.id,
          status: 'error',
          error: errorMessage
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'error').length;

    return new Response(
      JSON.stringify({
        message: `Processed ${articlesToProcess.length} articles`,
        success: successCount,
        failed: failCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in optimize-article-seo:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
