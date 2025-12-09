import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export interface SearchResult {
  id: string;
  type: "article" | "company" | "executive" | "topic" | "region";
  title: string;
  subtitle?: string;
  slug: string;
  url: string;
}

const TOPICS = [
  { name: "Mills & Manufacturing", slug: "mills-manufacturing" },
  { name: "Pricing & Markets", slug: "pricing-markets" },
  { name: "Projects & Contracts", slug: "projects-contracts" },
  { name: "Supply Chain", slug: "supply-chain" },
  { name: "Technology", slug: "technology" },
  { name: "Sustainability", slug: "sustainability" },
];

const REGIONS = [
  { name: "Americas", slug: "americas" },
  { name: "Europe", slug: "europe" },
  { name: "Africa", slug: "africa" },
  { name: "Middle East", slug: "middle-east" },
  { name: "Asia-Pacific", slug: "asia-pacific" },
  { name: "Australia", slug: "australia" },
];

export function useSearchData() {
  const { data: articles = [], isLoading: loadingArticles } = useQuery({
    queryKey: ["search-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, subtitle")
        .in("status", ["published", "featured"])
        .order("publish_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ["search-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, industry_role, headquarters")
        .order("name")
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: executives = [], isLoading: loadingExecutives } = useQuery({
    queryKey: ["search-executives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("executives")
        .select("id, name, slug, title, company_name")
        .order("name")
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const searchIndex = useMemo(() => {
    const results: SearchResult[] = [];

    // Add articles
    articles.forEach((article) => {
      results.push({
        id: article.id,
        type: "article",
        title: article.title,
        subtitle: article.subtitle || undefined,
        slug: article.slug,
        url: `/article/${article.slug}`,
      });
    });

    // Add companies
    companies.forEach((company) => {
      results.push({
        id: company.id,
        type: "company",
        title: company.name,
        subtitle: company.industry_role || company.headquarters || undefined,
        slug: company.slug,
        url: `/directory/company/${company.slug}`,
      });
    });

    // Add executives
    executives.forEach((exec) => {
      results.push({
        id: exec.id,
        type: "executive",
        title: exec.name,
        subtitle: `${exec.title} at ${exec.company_name}`,
        slug: exec.slug,
        url: `/ceo/${exec.slug}`,
      });
    });

    // Add topics
    TOPICS.forEach((topic) => {
      results.push({
        id: `topic-${topic.slug}`,
        type: "topic",
        title: topic.name,
        slug: topic.slug,
        url: `/topic/${topic.slug}`,
      });
    });

    // Add regions
    REGIONS.forEach((region) => {
      results.push({
        id: `region-${region.slug}`,
        type: "region",
        title: region.name,
        subtitle: "Region",
        slug: region.slug,
        url: `/region/${region.slug}`,
      });
    });

    return results;
  }, [articles, companies, executives]);

  const isLoading = loadingArticles || loadingCompanies || loadingExecutives;

  return { searchIndex, isLoading };
}

export function filterSearchResults(
  searchIndex: SearchResult[],
  query: string
): SearchResult[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  
  return searchIndex
    .filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(lowerQuery);
      const subtitleMatch = item.subtitle?.toLowerCase().includes(lowerQuery);
      return titleMatch || subtitleMatch;
    })
    .slice(0, 20);
}
