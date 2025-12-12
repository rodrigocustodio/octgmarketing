import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ArticleAuthor {
  id: string;
  name: string;
  title: string;
  bio: string | null;
  avatar_url: string | null;
  slug: string;
}

export interface ArticleCompany {
  id: string;
  name: string;
  slug: string;
  headquarters: string | null;
  website: string | null;
}

export interface ArticleWithRegion {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  body: string | null;
  hero_image_url: string | null;
  publish_date: string | null;
  status: string;
  created_at: string;
  region: {
    id: string;
    name: string;
    slug: string;
  } | null;
  author?: ArticleAuthor | null;
  companies?: ArticleCompany[];
}

export function usePublishedArticles(limit?: number) {
  return useQuery({
    queryKey: ["published-articles", limit],
    queryFn: async () => {
      let query = supabase
        .from("articles")
        .select(`
          id,
          title,
          subtitle,
          slug,
          body,
          hero_image_url,
          publish_date,
          status,
          created_at,
          region:regions(id, name, slug)
        `)
        .in("status", ["published", "featured"])
        .order("publish_date", { ascending: false, nullsFirst: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ArticleWithRegion[];
    },
  });
}

export function useFeaturedArticle() {
  return useQuery({
    queryKey: ["featured-article"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          id,
          title,
          subtitle,
          slug,
          body,
          hero_image_url,
          publish_date,
          status,
          created_at,
          region:regions(id, name, slug)
        `)
        .eq("status", "featured")
        .order("publish_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      // If no featured article, get the most recent published one
      if (!data) {
        const { data: latestData, error: latestError } = await supabase
          .from("articles")
          .select(`
            id,
            title,
            subtitle,
            slug,
            body,
            hero_image_url,
            publish_date,
            status,
            created_at,
            region:regions(id, name, slug)
          `)
          .eq("status", "published")
          .order("publish_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestError) throw latestError;
        return latestData as ArticleWithRegion | null;
      }

      return data as ArticleWithRegion;
    },
  });
}

export function useArticleBySlug(slug: string) {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      // Fetch article with region and author
      const { data: article, error } = await supabase
        .from("articles")
        .select(`
          id,
          title,
          subtitle,
          slug,
          body,
          hero_image_url,
          publish_date,
          status,
          created_at,
          region:regions(id, name, slug),
          author:authors(id, name, title, bio, avatar_url, slug)
        `)
        .eq("slug", slug)
        .in("status", ["published", "featured"])
        .maybeSingle();

      if (error) throw error;
      if (!article) return null;

      // Fetch associated companies for this article
      const { data: articleCompanies } = await supabase
        .from("article_companies")
        .select(`
          company:companies(id, name, slug, headquarters, website)
        `)
        .eq("article_id", article.id);

      // Extract companies from the join result
      const companies = articleCompanies
        ?.map(ac => ac.company)
        .filter((c): c is ArticleCompany => c !== null) || [];

      return {
        ...article,
        companies
      } as ArticleWithRegion;
    },
    enabled: !!slug,
  });
}

export function useArticlesByRegion(regionSlug: string, limit?: number) {
  return useQuery({
    queryKey: ["articles-by-region", regionSlug, limit],
    queryFn: async () => {
      // First get the region ID
      const { data: region, error: regionError } = await supabase
        .from("regions")
        .select("id")
        .eq("slug", regionSlug)
        .maybeSingle();

      if (regionError) throw regionError;
      if (!region) return [];

      let query = supabase
        .from("articles")
        .select(`
          id,
          title,
          subtitle,
          slug,
          body,
          hero_image_url,
          publish_date,
          status,
          created_at,
          region:regions(id, name, slug)
        `)
        .eq("region_id", region.id)
        .in("status", ["published", "featured"])
        .order("publish_date", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ArticleWithRegion[];
    },
    enabled: !!regionSlug,
  });
}

export function useRelatedArticles(currentSlug: string, regionId?: string, limit: number = 3) {
  return useQuery({
    queryKey: ["related-articles", currentSlug, regionId, limit],
    queryFn: async () => {
      let query = supabase
        .from("articles")
        .select(`
          id,
          title,
          subtitle,
          slug,
          hero_image_url,
          publish_date,
          status,
          created_at,
          region:regions(id, name, slug)
        `)
        .neq("slug", currentSlug)
        .in("status", ["published", "featured"])
        .order("publish_date", { ascending: false })
        .limit(limit);

      if (regionId) {
        query = query.eq("region_id", regionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ArticleWithRegion[];
    },
    enabled: !!currentSlug,
  });
}

export function useRegions() {
  return useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("id, name, slug")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
}

export function useTopics() {
  return useQuery({
    queryKey: ["topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("id, name, slug")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
}

export function useArticlesByTopic(topicSlug: string, limit?: number) {
  return useQuery({
    queryKey: ["articles-by-topic", topicSlug, limit],
    queryFn: async () => {
      // First get the topic ID
      const { data: topic, error: topicError } = await supabase
        .from("topics")
        .select("id")
        .eq("slug", topicSlug)
        .maybeSingle();

      if (topicError) throw topicError;
      if (!topic) return [];

      // Get article IDs linked to this topic
      const { data: articleTopics, error: linkError } = await supabase
        .from("article_topics")
        .select("article_id")
        .eq("topic_id", topic.id);

      if (linkError) throw linkError;
      if (!articleTopics || articleTopics.length === 0) return [];

      const articleIds = articleTopics.map((at) => at.article_id);

      let query = supabase
        .from("articles")
        .select(`
          id,
          title,
          subtitle,
          slug,
          body,
          hero_image_url,
          publish_date,
          status,
          created_at,
          region:regions(id, name, slug)
        `)
        .in("id", articleIds)
        .in("status", ["published", "featured"])
        .order("publish_date", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ArticleWithRegion[];
    },
    enabled: !!topicSlug,
  });
}

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
}

// Lightweight article type for homepage cards (no body content)
export interface ArticlePreview {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  hero_image_url: string | null;
  publish_date: string | null;
  status: string;
  created_at: string;
  region: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface ArticleWithTopics extends ArticlePreview {
  topics?: { id: string; name: string; slug: string }[];
}

export function useHomepageArticles() {
  return useQuery({
    queryKey: ["homepage-articles"],
    queryFn: async () => {
      // Run all 3 queries in parallel for maximum speed
      const [articlesResult, articleTopicsResult, topicsResult] = await Promise.all([
        // Fetch published articles WITHOUT body (not needed for cards)
        supabase
          .from("articles")
          .select(`
            id,
            title,
            subtitle,
            slug,
            hero_image_url,
            publish_date,
            status,
            created_at,
            region:regions(id, name, slug)
          `)
          .in("status", ["published", "featured"])
          .order("publish_date", { ascending: false, nullsFirst: false })
          .limit(40), // Homepage only needs ~30 articles max
        
        // Fetch article-topic relationships
        supabase
          .from("article_topics")
          .select("article_id, topic_id"),
        
        // Fetch all topics
        supabase
          .from("topics")
          .select("id, name, slug")
      ]);

      if (articlesResult.error) throw articlesResult.error;
      if (articleTopicsResult.error) throw articleTopicsResult.error;
      if (topicsResult.error) throw topicsResult.error;

      const articles = articlesResult.data || [];
      const articleTopics = articleTopicsResult.data || [];
      const topics = topicsResult.data || [];

      // Create topic lookup map
      const topicMap = new Map(topics.map(t => [t.id, t]));

      // Attach topics to articles
      const articlesWithTopics: ArticleWithTopics[] = articles.map(article => {
        const articleTopicIds = articleTopics
          .filter(at => at.article_id === article.id)
          .map(at => at.topic_id);
        
        const articleTopicsList = articleTopicIds
          .map(id => topicMap.get(id))
          .filter((t): t is { id: string; name: string; slug: string } => !!t);

        return {
          ...article,
          topics: articleTopicsList,
        } as ArticleWithTopics;
      });

      return articlesWithTopics;
    },
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}
