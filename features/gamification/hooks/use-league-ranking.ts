import { useQuery } from "@tanstack/react-query";
import { fetchLeagueRanking } from "../api/gamification-api";
import { queryKeys } from "@/shared/lib/query-keys";

export function useLeagueRanking(tier: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.gamification.leagueRanking(tier),
    queryFn: () => fetchLeagueRanking(tier, limit),
  });
}
