import { useQuery } from "@tanstack/react-query";
import { fetchMyLeague } from "../api/gamification-api";
import { queryKeys } from "@/shared/lib/query-keys";

export function useMyLeague() {
  return useQuery({
    queryKey: queryKeys.gamification.myLeague(),
    queryFn: fetchMyLeague,
  });
}
