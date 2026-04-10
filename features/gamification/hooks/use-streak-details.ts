import { useQuery } from "@tanstack/react-query";
import { fetchStreakDetails } from "../api/gamification-api";
import { queryKeys } from "@/shared/lib/query-keys";

export function useStreakDetails() {
  return useQuery({
    queryKey: queryKeys.gamification.streak(),
    queryFn: fetchStreakDetails,
  });
}
