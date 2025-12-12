import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Company = Tables<"companies"> & {
  regions?: { name: string; slug: string } | null;
};

export const useCompaniesAdmin = () => {
  return useQuery({
    queryKey: ["companies-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select(`
          *,
          regions:region_id (name, slug)
        `)
        .order("name");

      if (error) throw error;
      return data as Company[];
    },
  });
};

export const useCompanyById = (id: string | undefined) => {
  return useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("companies")
        .select(`
          *,
          regions:region_id (name, slug)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Company | null;
    },
    enabled: !!id,
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TablesUpdate<"companies"> }) => {
      const { data: result, error } = await supabase
        .from("companies")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies-admin"] });
      queryClient.invalidateQueries({ queryKey: ["company"] });
    },
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TablesInsert<"companies">) => {
      const { data: result, error } = await supabase
        .from("companies")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies-admin"] });
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies-admin"] });
    },
  });
};

export const useGenerateCompanyDescription = () => {
  return useMutation({
    mutationFn: async ({ companyName, website }: { companyName: string; website?: string | null }) => {
      const { data, error } = await supabase.functions.invoke("generate-company-description", {
        body: { companyName, website },
      });

      if (error) throw error;
      return data as { description: string };
    },
  });
};

export type EnrichedCompanyData = {
  website?: string | null;
  description?: string | null;
  industry_role?: string | null;
  region?: string | null;
  year_founded?: number | null;
  phone?: string | null;
  email?: string | null;
  headquarters?: string | null;
  country?: string | null;
};

export const useEnrichCompanyProfile = () => {
  return useMutation({
    mutationFn: async ({ companyName, existingData }: { companyName: string; existingData?: Partial<Company> }) => {
      const { data, error } = await supabase.functions.invoke("enrich-company-profile", {
        body: { companyName, existingData },
      });

      if (error) throw error;
      return data as EnrichedCompanyData;
    },
  });
};
