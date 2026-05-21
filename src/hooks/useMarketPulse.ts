import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NewsroomFocus {
  name: string;
  slug: string;
  count: number;
  delta: number;
}

export interface MarketPulse {
  id: string;
  rig_count_us: number | null;
  rig_count_us_delta: number | null;
  rig_count_as_of: string | null;
  cost_pressure: "tightening" | "neutral" | "softening";
  cost_pressure_rationale: string | null;
  newsroom_focus: NewsroomFocus[];
  editorial_read: string | null;
  updated_at: string;
}

export function useMarketPulse() {
  return useQuery({
    queryKey: ["market-pulse"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_pulse")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as MarketPulse | null;
    },
    staleTime: 60 * 60 * 1000, // 1 hour — data only updates weekly
    refetchOnWindowFocus: false,
  });
}
