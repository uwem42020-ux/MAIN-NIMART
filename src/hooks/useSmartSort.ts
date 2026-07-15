// src/hooks/useSmartSort.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

interface SmartSortResult {
  provider_id: string;
  score: number;
}

export function useSmartSort(
  userId?: string,
  userLat?: number,
  userLng?: number,
  category?: string,
  searchTerm?: string,
  limit = 20
) {
  return useQuery({
    queryKey: ["smart-sort", userId, userLat, userLng, category, searchTerm, limit],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.functions.invoke("smart-sort", {
        body: {
          user_id: userId,
          user_lat: userLat,
          user_lng: userLng,
          category,
          search_term: searchTerm,
          limit,
        },
      });
      if (error) throw error;
      return (data as SmartSortResult[]) ?? [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}