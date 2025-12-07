import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SteelPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  category: string;
  region: string;
  currency: string;
  updated_at: string;
}

export function useSteelPrices() {
  return useQuery({
    queryKey: ["steel-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("steel_prices")
        .select("*")
        .order("category", { ascending: true })
        .order("symbol", { ascending: true });

      if (error) throw error;
      return data as SteelPrice[];
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}
