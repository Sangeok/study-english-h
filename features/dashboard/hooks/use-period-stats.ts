import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib";
import { queryKeys } from "@/shared/lib/query-keys";
import type { PeriodStatsResponse } from "../types";

async function fetchPeriodStats(period: string): Promise<PeriodStatsResponse> {
  return apiClient.get<PeriodStatsResponse>(`/api/dashboard/period-stats?period=${period}`);
}

export function usePeriodStats(period: string = "week") {
  return useQuery({
    queryKey: queryKeys.dashboard.periodStats(period),
    queryFn: () => fetchPeriodStats(period),
    staleTime: 1000 * 60 * 5,
  });
}
