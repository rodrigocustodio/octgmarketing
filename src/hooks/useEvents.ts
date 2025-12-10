import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Event {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string;
  venue: string | null;
  start_date: string;
  end_date: string | null;
  website: string | null;
  image_url: string | null;
  gallery_images: string[] | null;
  region_id: string | null;
  attendees_count: string | null;
  exhibitors_count: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  region?: { id: string; name: string; slug: string } | null;
}

// Fetch all events
export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          region:regions(id, name, slug)
        `)
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data as Event[];
    },
  });
}

// Fetch upcoming events for homepage (next 60 days)
export function useUpcomingEvents(limit = 6) {
  return useQuery({
    queryKey: ["upcoming-events", limit],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const sixtyDaysLater = new Date(
        Date.now() + 60 * 24 * 60 * 60 * 1000
      ).toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          region:regions(id, name, slug)
        `)
        .gte("start_date", today)
        .lte("start_date", sixtyDaysLater)
        .order("start_date", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as Event[];
    },
  });
}

// Fetch single event by slug
export function useEvent(slug: string) {
  return useQuery({
    queryKey: ["event", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          region:regions(id, name, slug)
        `)
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data as Event | null;
    },
    enabled: !!slug,
  });
}

// Fetch single event by ID (for admin editing)
export function useEventById(id: string) {
  return useQuery({
    queryKey: ["event-by-id", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          region:regions(id, name, slug)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Event | null;
    },
    enabled: !!id,
  });
}

// Create event
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: Omit<Event, "id" | "created_at" | "updated_at" | "region">) => {
      const { data, error } = await supabase
        .from("events")
        .insert(event)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
    },
  });
}

// Update event
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: Partial<Event> & { id: string }) => {
      const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
      queryClient.invalidateQueries({ queryKey: ["event-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
    },
  });
}

// Delete event
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
    },
  });
}
