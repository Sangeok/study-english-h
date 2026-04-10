import { useQuery } from "@tanstack/react-query";
import { fetchAchievements } from "../api/gamification-api";
import { queryKeys } from "@/shared/lib/query-keys";

export function useAchievements() {
  return useQuery({
    queryKey: queryKeys.gamification.achievements(),
    queryFn: fetchAchievements,
  });
}
