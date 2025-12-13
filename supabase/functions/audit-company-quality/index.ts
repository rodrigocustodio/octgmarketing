import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompanyData {
  id: string;
  name: string;
  website?: string | null;
  description?: string | null;
  industry_role?: string | null;
  headquarters?: string | null;
  country?: string | null;
  year_founded?: number | null;
  region?: string | null;
}

interface AuditResult {
  company_id: string;
  company_name: string;
  company_exists: boolean;
  website_correct: boolean;
  website_suggestion: string | null;
  industry_role_correct: boolean;
  industry_role_suggestion: string | null;
  headquarters_correct: boolean;
  headquarters_suggestion: string | null;
  year_founded_correct: boolean;
  year_founded_suggestion: number | null;
  description_quality: 'excellent' | 'good' | 'fair' | 'poor' | 'missing';
  description_issues: string[];
  overall_score: number;
  recommendations: string[];
  error?: string;
}

async function auditCompanyWithPerplexity(
  company: CompanyData,
  apiKey: string
): Promise<AuditResult> {
  const baseResult: AuditResult = {
    company_id: company.id,
    company_name: company.name,
    company_exists: false,
    website_correct: false,
    website_suggestion: null,
    industry_role_correct: false,
    industry_role_suggestion: null,
    headquarters_correct: false,
    headquarters_suggestion: null,
    year_founded_correct: false,
    year_founded_suggestion: null,
    description_quality: 'missing',
    description_issues: [],
    overall_score: 0,
    recommendations: [],
  };

  try {
    const prompt = `Research the company "${company.name}" in the OCTG (Oil Country Tubular Goods), energy, oil & gas industry.

Current data we have:
- Website: ${company.website || 'NOT SET'}
- Description: ${company.description ? company.description.substring(0, 200) + '...' : 'NOT SET'}
- Industry Role: ${company.industry_role || 'NOT SET'}
- Headquarters: ${company.headquarters || 'NOT SET'}
- Country: ${company.country || 'NOT SET'}
- Year Founded: ${company.year_founded || 'NOT SET'}

Valid industry roles are EXACTLY: mill, yard, inspection, drilling, logistics, software, trading
For industry_role_suggestion, you MUST use one of these exact values or null.

CRITICAL: Respond with ONLY valid JSON. All numbers must be digits (not words like "sixty five").
overall_score MUST be an integer between 0 and 100.

{
  "company_exists": true,
  "is_octg_related": true,
  "website_correct": true,
  "website_suggestion": null,
  "industry_role_correct": true,
  "industry_role_suggestion": null,
  "headquarters_correct": true,
  "headquarters_suggestion": null,
  "year_founded_correct": true,
  "year_founded_suggestion": null,
  "description_quality": "good",
  "description_issues": [],
  "overall_score": 85,
  "recommendations": []
}

Scoring guide:
- 100: All data correct and complete
- 80-99: Minor issues or missing optional data
- 60-79: Some incorrect or missing important data
- 40-59: Multiple issues, needs attention
- 0-39: Major problems or company may not exist`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: 'You are a data quality auditor. Always respond with valid JSON only, no markdown or explanation.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Perplexity API error for ${company.name}:`, errorText);
      return { ...baseResult, error: `API error: ${response.status}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log(`Perplexity response for ${company.name}:`, content);

    // Extract JSON from response
    let jsonStr = content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    // Fix common JSON issues from AI
    // Convert word numbers to digits (e.g., "sixty five" -> 65)
    const wordToNumber: Record<string, number> = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
      'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90, 'hundred': 100
    };
    
    // Replace "overall_score": word_number patterns
    jsonStr = jsonStr.replace(/"overall_score"\s*:\s*([a-z\s]+)(?=[,\}])/gi, (_match: string, words: string) => {
      const cleaned = words.trim().toLowerCase();
      // Try to parse compound numbers like "sixty five"
      const parts = cleaned.split(/\s+/);
      let total = 0;
      for (const part of parts) {
        if (wordToNumber[part] !== undefined) {
          total += wordToNumber[part];
        }
      }
      if (total > 0) {
        return `"overall_score": ${total}`;
      }
      return `"overall_score": 50`; // Default fallback
    });

    try {
      const parsed = JSON.parse(jsonStr);
      
      // Ensure overall_score is a valid number
      let score = parsed.overall_score;
      if (typeof score !== 'number' || isNaN(score)) {
        score = 50;
      }
      score = Math.max(0, Math.min(100, Math.round(score)));
      
      // Validate industry_role_suggestion against allowed values
      const validRoles = ['mill', 'yard', 'inspection', 'drilling', 'logistics', 'software', 'trading'];
      let industryRoleSuggestion = parsed.industry_role_suggestion || null;
      if (industryRoleSuggestion && !validRoles.includes(industryRoleSuggestion.toLowerCase())) {
        // Try to map common variations
        const roleMap: Record<string, string> = {
          'drilling services': 'drilling',
          'oilfield services': 'drilling',
          'pipe manufacturer': 'mill',
          'steel manufacturer': 'mill',
          'tube manufacturer': 'mill',
          'pipe mill': 'mill',
          'service provider': 'inspection',
          'distributor': 'trading',
          'trader': 'trading',
        };
        industryRoleSuggestion = roleMap[industryRoleSuggestion.toLowerCase()] || null;
      }

      return {
        company_id: company.id,
        company_name: company.name,
        company_exists: parsed.company_exists ?? false,
        website_correct: parsed.website_correct ?? false,
        website_suggestion: parsed.website_suggestion || null,
        industry_role_correct: parsed.industry_role_correct ?? false,
        industry_role_suggestion: industryRoleSuggestion,
        headquarters_correct: parsed.headquarters_correct ?? false,
        headquarters_suggestion: parsed.headquarters_suggestion || null,
        year_founded_correct: parsed.year_founded_correct ?? false,
        year_founded_suggestion: parsed.year_founded_suggestion || null,
        description_quality: parsed.description_quality || 'missing',
        description_issues: parsed.description_issues || [],
        overall_score: score,
        recommendations: parsed.recommendations || [],
      };
    } catch (parseError) {
      console.error(`JSON parse error for ${company.name}:`, parseError);
      return { ...baseResult, error: 'Failed to parse AI response' };
    }
  } catch (error) {
    console.error(`Error auditing ${company.name}:`, error);
    return { ...baseResult, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companies } = await req.json() as { companies: CompanyData[] };
    
    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No companies provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      return new Response(
        JSON.stringify({ error: 'PERPLEXITY_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`\n=== Auditing ${companies.length} companies ===\n`);

    const results: AuditResult[] = [];
    
    for (const company of companies) {
      console.log(`Auditing: ${company.name}`);
      const result = await auditCompanyWithPerplexity(company, perplexityApiKey);
      results.push(result);
      
      // Small delay between requests
      if (companies.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Calculate summary stats
    const summary = {
      total: results.length,
      averageScore: Math.round(results.reduce((sum, r) => sum + r.overall_score, 0) / results.length),
      companiesExist: results.filter(r => r.company_exists).length,
      websitesCorrect: results.filter(r => r.website_correct).length,
      websiteSuggestions: results.filter(r => r.website_suggestion).length,
      industryRoleCorrect: results.filter(r => r.industry_role_correct).length,
      headquartersCorrect: results.filter(r => r.headquarters_correct).length,
      yearFoundedCorrect: results.filter(r => r.year_founded_correct).length,
      excellentDescriptions: results.filter(r => r.description_quality === 'excellent').length,
      goodDescriptions: results.filter(r => r.description_quality === 'good').length,
      fairDescriptions: results.filter(r => r.description_quality === 'fair').length,
      poorDescriptions: results.filter(r => r.description_quality === 'poor').length,
      missingDescriptions: results.filter(r => r.description_quality === 'missing').length,
      errors: results.filter(r => r.error).length,
    };

    console.log(`\n=== Audit Summary ===`);
    console.log(`Average Score: ${summary.averageScore}`);
    console.log(`Companies Verified: ${summary.companiesExist}/${summary.total}`);
    console.log(`Websites Correct: ${summary.websitesCorrect}/${summary.total}`);
    console.log(`Errors: ${summary.errors}`);

    return new Response(
      JSON.stringify({ results, summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in audit-company-quality function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
