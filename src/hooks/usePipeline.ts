import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSourceArticleCounts() {
  return useQuery({
    queryKey: ["source-article-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("source_articles")
        .select("status");
      
      if (error) throw error;
      
      const counts = {
        new: 0,
        processed: 0,
        failed: 0,
        total: data.length,
      };
      
      data.forEach((article) => {
        if (article.status === "new") counts.new++;
        else if (article.status === "processed") counts.processed++;
        else if (article.status === "failed") counts.failed++;
      });
      
      return counts;
    },
  });
}

export function useDraftArticleCounts() {
  return useQuery({
    queryKey: ["draft-article-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("draft_articles")
        .select("status");
      
      if (error) throw error;
      
      const counts = {
        pending_review: 0,
        approved: 0,
        rejected: 0,
        published: 0,
        total: data.length,
      };
      
      data.forEach((article) => {
        if (article.status === "pending_review") counts.pending_review++;
        else if (article.status === "approved") counts.approved++;
        else if (article.status === "rejected") counts.rejected++;
        else if (article.status === "published") counts.published++;
      });
      
      return counts;
    },
  });
}

export function useScrapeOctg() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (region?: string) => {
      const { data, error } = await supabase.functions.invoke("scrape-octg", {
        method: "POST",
        body: region ? { region } : {},
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["source-article-counts"] });
      toast({
        title: "Scraping Complete",
        description: `Inserted ${data.articlesInserted} new articles from ${data.sourcesProcessed} sources.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Scraping Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useGenerateDrafts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-drafts", {
        method: "POST",
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["source-article-counts"] });
      queryClient.invalidateQueries({ queryKey: ["draft-article-counts"] });
      toast({
        title: "Drafts Generated",
        description: `Created ${data.generated} drafts from ${data.processed} source articles.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
