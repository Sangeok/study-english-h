"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import type { RecentActivityResponse } from "./activity-types";

async function fetchRecentActivity(limit: number = 10): Promise<RecentActivityResponse> {
  const response = await fetch(`/api/profile/recent-activity?limit=${limit}`);

  if (!response.ok) {
    throw new Error("Failed to fetch recent activity");
  }

  return response.json();
}

export function useRecentActivity(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.profile.recentActivity(limit),
    queryFn: () => fetchRecentActivity(limit),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
