import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import type { PeriodStatsResponse } from "../types";

async function fetchPeriodStats(period: string): Promise<PeriodStatsResponse> {
  const res = await fetch(`/api/dashboard/period-stats?period=${period}`);
  if (!res.ok) throw new Error("Failed to fetch period stats");
  return res.json();
}

export function usePeriodStats(period: string = "week") {
  return useQuery({
    queryKey: queryKeys.dashboard.periodStats(period),
    queryFn: () => fetchPeriodStats(period),
    staleTime: 1000 * 60 * 5,
  });
}
