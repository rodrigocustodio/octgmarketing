import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditResult {
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

export interface AuditSummary {
  total: number;
  averageScore: number;
  companiesExist: number;
  websitesCorrect: number;
  websiteSuggestions: number;
  industryRoleCorrect: number;
  headquartersCorrect: number;
  yearFoundedCorrect: number;
  excellentDescriptions: number;
  goodDescriptions: number;
  fairDescriptions: number;
  poorDescriptions: number;
  missingDescriptions: number;
  errors: number;
}

interface CompanyInput {
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

export function useAuditCompanies() {
  return useMutation({
    mutationFn: async (companies: CompanyInput[]): Promise<{ results: AuditResult[]; summary: AuditSummary }> => {
      const { data, error } = await supabase.functions.invoke('audit-company-quality', {
        body: { companies },
      });

      if (error) throw error;
      return data;
    },
  });
}
