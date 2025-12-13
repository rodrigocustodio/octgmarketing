import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export interface CompanyWithRegion {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  country: string | null;
  description: string | null;
  logo_url: string | null;
  industry_role: string | null;
  region_id: string | null;
  headquarters: string | null;
  year_founded: number | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  region: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export const INDUSTRY_ROLES = [
  { value: "mill", label: "Mills & Manufacturers", icon: "Factory" },
  { value: "yard", label: "Yards & Threading", icon: "Wrench" },
  { value: "inspection", label: "Inspection & Testing", icon: "Search" },
  { value: "drilling", label: "Drilling Contractors", icon: "Drill" },
  { value: "logistics", label: "Logistics & Transport", icon: "Truck" },
  { value: "software", label: "SCM & Software", icon: "Monitor" },
  { value: "trading", label: "Trading & Distribution", icon: "Package" },
  { value: "consulting", label: "Consulting & Advisory", icon: "Briefcase" },
] as const;

export function useAllCompanies() {
  return useQuery({
    queryKey: ["all-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select(`
          id,
          name,
          slug,
          website,
          country,
          description,
          logo_url,
          industry_role,
          region_id,
          headquarters,
          year_founded,
          phone,
          email,
          notes,
          region:regions(id, name, slug)
        `)
        .order("name");

      if (error) throw error;
      return data as CompanyWithRegion[];
    },
  });
}

export function useCompaniesByRegion(regionSlug: string) {
  return useQuery({
    queryKey: ["companies-by-region", regionSlug],
    queryFn: async () => {
      const { data: region, error: regionError } = await supabase
        .from("regions")
        .select("id, name, slug")
        .eq("slug", regionSlug)
        .maybeSingle();

      if (regionError) throw regionError;
      if (!region) return { companies: [], region: null };

      const { data, error } = await supabase
        .from("companies")
        .select(`
          id,
          name,
          slug,
          website,
          country,
          description,
          logo_url,
          industry_role,
          region_id,
          headquarters,
          year_founded,
          phone,
          email,
          notes,
          region:regions(id, name, slug)
        `)
        .eq("region_id", region.id)
        .order("name");

      if (error) throw error;
      return { companies: data as CompanyWithRegion[], region };
    },
    enabled: !!regionSlug,
  });
}

export function useCompaniesByCategory(category: string) {
  return useQuery({
    queryKey: ["companies-by-category", category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select(`
          id,
          name,
          slug,
          website,
          country,
          description,
          logo_url,
          industry_role,
          region_id,
          headquarters,
          year_founded,
          phone,
          email,
          notes,
          region:regions(id, name, slug)
        `)
        .eq("industry_role", category as any)
        .order("name");

      if (error) throw error;
      return data as CompanyWithRegion[];
    },
    enabled: !!category,
  });
}

export function useCompanyBySlug(slug: string) {
  return useQuery({
    queryKey: ["company", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select(`
          id,
          name,
          slug,
          website,
          country,
          description,
          logo_url,
          industry_role,
          region_id,
          headquarters,
          year_founded,
          phone,
          email,
          notes,
          region:regions(id, name, slug)
        `)
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data as CompanyWithRegion | null;
    },
    enabled: !!slug,
  });
}

export function useDirectoryStats() {
  return useQuery({
    queryKey: ["directory-stats"],
    queryFn: async () => {
      const { data: companies, error } = await supabase
        .from("companies")
        .select("id, industry_role, region_id");

      if (error) throw error;

      const totalCompanies = companies?.length || 0;
      
      const regionCounts: Record<string, number> = {};
      const categoryCounts: Record<string, number> = {};
      
      companies?.forEach((company) => {
        if (company.region_id) {
          regionCounts[company.region_id] = (regionCounts[company.region_id] || 0) + 1;
        }
        if (company.industry_role) {
          categoryCounts[company.industry_role] = (categoryCounts[company.industry_role] || 0) + 1;
        }
      });

      return {
        totalCompanies,
        regionCounts,
        categoryCounts,
        regionsWithCompanies: Object.keys(regionCounts).length,
        categoriesWithCompanies: Object.keys(categoryCounts).length,
      };
    },
  });
}

export function useSimilarCompanies(currentSlug: string, regionId?: string | null, industryRole?: string | null, limit = 5) {
  return useQuery({
    queryKey: ["similar-companies", currentSlug, regionId, industryRole, limit],
    queryFn: async () => {
      let query = supabase
        .from("companies")
        .select(`
          id,
          name,
          slug,
          website,
          country,
          industry_role,
          region:regions(id, name, slug)
        `)
        .neq("slug", currentSlug)
        .limit(limit);

      if (industryRole) {
        query = query.eq("industry_role", industryRole as any);
      } else if (regionId) {
        query = query.eq("region_id", regionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!currentSlug,
  });
}
