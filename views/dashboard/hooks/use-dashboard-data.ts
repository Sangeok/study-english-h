import { useProfileStats } from "@/entities/user/model/use-profile-stats";
import { useListeningGap } from "@/entities/user/model/use-listening-gap";
import { usePeriodStats } from "@/features/dashboard";
import { useMyLeague } from "@/features/gamification";

export function useDashboardData(period: string) {
  const profileQuery = useProfileStats();
  const periodQuery = usePeriodStats(period);
  const leagueQuery = useMyLeague();
  // 대시보드의 데이터 조립 지점은 여기 하나다 — ui/ 컴포넌트는 전부 props 만 받는다.
  const listeningGapQuery = useListeningGap();

  return {
    profile: profileQuery.data,
    periodStats: periodQuery.data,
    league: leagueQuery.data,
    listeningGap: listeningGapQuery.data,
    isProfileLoading: profileQuery.isLoading,
    isPeriodLoading: periodQuery.isLoading,
    isLeagueLoading: leagueQuery.isLoading,
    isListeningGapLoading: listeningGapQuery.isLoading,
  };
}
