import { useProfileStats } from "@/entities/user/model/use-profile-stats";
import { usePeriodStats } from "@/features/dashboard";
import { useMyLeague } from "@/features/gamification";

export function useDashboardData(period: string) {
  const profileQuery = useProfileStats();
  const periodQuery = usePeriodStats(period);
  const leagueQuery = useMyLeague();

  return {
    profile: profileQuery.data,
    periodStats: periodQuery.data,
    league: leagueQuery.data,
    isProfileLoading: profileQuery.isLoading,
    isPeriodLoading: periodQuery.isLoading,
    isLeagueLoading: leagueQuery.isLoading,
  };
}
