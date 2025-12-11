import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EditorialStats {
  totalArticles: number;
  regionsCount: number;
  totalRegions: number;
  topicsCount: number;
  totalTopics: number;
  companiesMentioned: number;
  totalCompanies: number;
  articlesThisWeek: number;
  articlesLastWeek: number;
}

export interface RegionTopicCoverage {
  regionId: string;
  regionName: string;
  topicId: string;
  topicName: string;
  articleCount: number;
}

export interface CompanyMention {
  companyId: string;
  companyName: string;
  industryRole: string | null;
  mentionCount: number;
  lastMentioned: string | null;
}

export interface EditorialSuggestion {
  id: string;
  title: string;
  description: string | null;
  suggestion_type: string;
  target_region_id: string | null;
  target_topic_ids: string[] | null;
  target_company_ids: string[] | null;
  seo_score: number | null;
  business_score: number | null;
  status: string;
  source: string | null;
  created_at: string;
  region?: { name: string } | null;
}

export function useEditorialStats() {
  return useQuery({
    queryKey: ["editorial-stats"],
    queryFn: async (): Promise<EditorialStats> => {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const [
        articlesResult,
        regionsResult,
        topicsResult,
        companiesResult,
        articleCompaniesResult,
        thisWeekResult,
        lastWeekResult,
      ] = await Promise.all([
        supabase.from("articles").select("id", { count: "exact" }).in("status", ["published", "featured"]),
        supabase.from("regions").select("id", { count: "exact" }),
        supabase.from("topics").select("id", { count: "exact" }),
        supabase.from("companies").select("id", { count: "exact" }),
        supabase.from("article_companies").select("company_id"),
        supabase.from("articles").select("id", { count: "exact" }).in("status", ["published", "featured"]).gte("publish_date", oneWeekAgo.toISOString()),
        supabase.from("articles").select("id", { count: "exact" }).in("status", ["published", "featured"]).gte("publish_date", twoWeeksAgo.toISOString()).lt("publish_date", oneWeekAgo.toISOString()),
      ]);

      // Get unique regions with articles
      const regionsWithArticles = await supabase
        .from("articles")
        .select("region_id")
        .in("status", ["published", "featured"])
        .not("region_id", "is", null);

      const uniqueRegions = new Set(regionsWithArticles.data?.map(a => a.region_id) || []);
      const uniqueCompanies = new Set(articleCompaniesResult.data?.map(ac => ac.company_id) || []);

      return {
        totalArticles: articlesResult.count || 0,
        regionsCount: uniqueRegions.size,
        totalRegions: regionsResult.count || 0,
        topicsCount: 0, // Will calculate below
        totalTopics: topicsResult.count || 0,
        companiesMentioned: uniqueCompanies.size,
        totalCompanies: companiesResult.count || 0,
        articlesThisWeek: thisWeekResult.count || 0,
        articlesLastWeek: lastWeekResult.count || 0,
      };
    },
  });
}

export function useCoverageMatrix() {
  return useQuery({
    queryKey: ["coverage-matrix"],
    queryFn: async () => {
      const [regionsResult, topicsResult, articlesResult, articleTopicsResult] = await Promise.all([
        supabase.from("regions").select("id, name").order("name"),
        supabase.from("topics").select("id, name").order("name"),
        supabase.from("articles").select("id, region_id").in("status", ["published", "featured"]),
        supabase.from("article_topics").select("article_id, topic_id"),
      ]);

      const regions = regionsResult.data || [];
      const topics = topicsResult.data || [];
      const articles = articlesResult.data || [];
      const articleTopics = articleTopicsResult.data || [];

      // Build coverage matrix
      const matrix: RegionTopicCoverage[] = [];
      const regionCounts: Record<string, number> = {};
      const topicCounts: Record<string, number> = {};

      for (const region of regions) {
        regionCounts[region.id] = 0;
        for (const topic of topics) {
          const articleIds = articles
            .filter(a => a.region_id === region.id)
            .map(a => a.id);
          
          const count = articleTopics.filter(
            at => articleIds.includes(at.article_id) && at.topic_id === topic.id
          ).length;

          matrix.push({
            regionId: region.id,
            regionName: region.name,
            topicId: topic.id,
            topicName: topic.name,
            articleCount: count,
          });

          regionCounts[region.id] += count;
          topicCounts[topic.id] = (topicCounts[topic.id] || 0) + count;
        }
      }

      return { regions, topics, matrix, regionCounts, topicCounts };
    },
  });
}

export function useCompanyMentions() {
  return useQuery({
    queryKey: ["company-mentions"],
    queryFn: async (): Promise<{ mentioned: CompanyMention[]; unmentioned: CompanyMention[] }> => {
      const [companiesResult, articleCompaniesResult, articlesResult] = await Promise.all([
        supabase.from("companies").select("id, name, industry_role"),
        supabase.from("article_companies").select("company_id, article_id"),
        supabase.from("articles").select("id, publish_date").in("status", ["published", "featured"]),
      ]);

      const companies = companiesResult.data || [];
      const articleCompanies = articleCompaniesResult.data || [];
      const articles = articlesResult.data || [];

      const articleDates = new Map(articles.map(a => [a.id, a.publish_date]));

      const mentionMap = new Map<string, { count: number; lastDate: string | null }>();
      
      for (const ac of articleCompanies) {
        const existing = mentionMap.get(ac.company_id) || { count: 0, lastDate: null };
        existing.count++;
        const articleDate = articleDates.get(ac.article_id);
        if (articleDate && (!existing.lastDate || articleDate > existing.lastDate)) {
          existing.lastDate = articleDate;
        }
        mentionMap.set(ac.company_id, existing);
      }

      const mentioned: CompanyMention[] = [];
      const unmentioned: CompanyMention[] = [];

      for (const company of companies) {
        const mention = mentionMap.get(company.id);
        const item: CompanyMention = {
          companyId: company.id,
          companyName: company.name,
          industryRole: company.industry_role,
          mentionCount: mention?.count || 0,
          lastMentioned: mention?.lastDate || null,
        };

        if (mention && mention.count > 0) {
          mentioned.push(item);
        } else {
          unmentioned.push(item);
        }
      }

      mentioned.sort((a, b) => b.mentionCount - a.mentionCount);
      unmentioned.sort((a, b) => a.companyName.localeCompare(b.companyName));

      return { mentioned, unmentioned };
    },
  });
}

export function useEditorialSuggestions() {
  return useQuery({
    queryKey: ["editorial-suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("editorial_suggestions")
        .select(`
          *,
          region:regions(name)
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as EditorialSuggestion[];
    },
  });
}

export function useUpdateSuggestionStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("editorial_suggestions")
        .update({ status })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["editorial-suggestions"] });
    },
  });
}

export function useGenerateTopicSuggestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-topic-suggestions");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["editorial-suggestions"] });
    },
  });
}

export function useGenerateArticleFromSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title, description }: { id: string; title: string; description?: string }) => {
      const content = `Topic: ${title}\n\n${description || "Write a comprehensive article about this topic."}`;
      
      const { data, error } = await supabase.functions.invoke("generate-article-from-content", {
        body: { content, source_name: "Editorial Suggestion" },
      });
      
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to generate article");

      // Insert the generated article as a draft
      const { data: draft, error: draftError } = await supabase
        .from("draft_articles")
        .insert({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          body_markdown: data.body,
          suggested_topic_ids: data.topics,
          suggested_company_ids: data.companies,
          region_id: data.region_id,
          tags: data.tags,
          status: "pending_review",
        })
        .select("id")
        .single();

      if (draftError) throw draftError;

      // Mark the suggestion as used
      await supabase
        .from("editorial_suggestions")
        .update({ status: "used" })
        .eq("id", id);

      return { draftId: draft.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["editorial-suggestions"] });
    },
  });
}
