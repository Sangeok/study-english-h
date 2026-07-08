"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, queryKeys } from "@/shared/lib";
import type { RecentActivityResponse } from "./activity-types";

async function fetchRecentActivity(limit: number = 10): Promise<RecentActivityResponse> {
  return apiClient.get<RecentActivityResponse>(`/api/profile/recent-activity?limit=${limit}`);
}

export function useRecentActivity(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.profile.recentActivity(limit),
    queryFn: () => fetchRecentActivity(limit),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
