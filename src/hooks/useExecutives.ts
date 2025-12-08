import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Executive {
  id: string;
  name: string;
  title: string;
  company_id: string | null;
  company_name: string;
  stock_symbol: string | null;
  bio: string | null;
  photo_url: string | null;
  region: string;
  slug: string;
  linkedin_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useExecutives() {
  return useQuery({
    queryKey: ["executives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("executives")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Executive[];
    },
  });
}

export function useExecutivesByRegion(region?: string) {
  return useQuery({
    queryKey: ["executives", "region", region],
    queryFn: async () => {
      let query = supabase.from("executives").select("*").order("name");

      if (region && region !== "all") {
        query = query.eq("region", region);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Executive[];
    },
  });
}

export function useExecutiveBySlug(slug: string) {
  return useQuery({
    queryKey: ["executive", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("executives")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data as Executive;
    },
    enabled: !!slug,
  });
}

export function useExecutiveById(id: string) {
  return useQuery({
    queryKey: ["executive", "id", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("executives")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Executive;
    },
    enabled: !!id && id !== "new",
  });
}

export function useUpdateExecutive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Executive>;
    }) => {
      const { data, error } = await supabase
        .from("executives")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executives"] });
      queryClient.invalidateQueries({ queryKey: ["executive"] });
    },
  });
}

export function useCreateExecutive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (executive: Omit<Executive, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("executives")
        .insert(executive)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executives"] });
    },
  });
}

export function useDeleteExecutive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("executives").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executives"] });
    },
  });
}

export function useExecutiveStats() {
  return useQuery({
    queryKey: ["executive-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("executives").select("region");

      if (error) throw error;

      const regionCounts: Record<string, number> = {};
      data?.forEach((exec) => {
        regionCounts[exec.region] = (regionCounts[exec.region] || 0) + 1;
      });

      return {
        total: data?.length || 0,
        byRegion: regionCounts,
      };
    },
  });
}
